import React, { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import {
  fetchCurrentPrices,
  fetchHistoricalPrices,
  formatDateForAPI,
  parseItemId,
  PriceData,
  HistoricalPrice,
} from "@/lib/api/albion-api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TrackedItem {
  id: string;
  itemId: string;
  name: string;
  tier: number;
  addedAt: string;
}

export interface MarketData {
  itemId: string;
  prices: PriceData[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

export interface HistoricalData {
  itemId: string;
  history: HistoricalPrice[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

interface MarketState {
  trackedItems: TrackedItem[];
  marketData: Record<string, MarketData>;
  historicalData: Record<string, HistoricalData>;
  loading: boolean;
  error: string | null;
  lastRefresh: string | null;
}

type MarketAction =
  | { type: "ADD_ITEM"; payload: TrackedItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "SET_TRACKED_ITEMS"; payload: TrackedItem[] }
  | { type: "SET_PRICES"; payload: { itemId: string; prices: PriceData[] } }
  | { type: "SET_HISTORY"; payload: { itemId: string; history: HistoricalPrice[] } }
  | { type: "SET_GLOBAL_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LAST_REFRESH"; payload: string };

const initialState: MarketState = {
  trackedItems: [],
  marketData: {},
  historicalData: {},
  loading: false,
  error: null,
  lastRefresh: null,
};

function marketReducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        trackedItems: [...state.trackedItems, action.payload],
      };

    case "REMOVE_ITEM":
      return {
        ...state,
        trackedItems: state.trackedItems.filter((item) => item.id !== action.payload),
        marketData: Object.fromEntries(
          Object.entries(state.marketData).filter(([key]) => key !== action.payload)
        ),
      };

    case "SET_TRACKED_ITEMS":
      return {
        ...state,
        trackedItems: action.payload,
      };

    case "SET_PRICES":
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.itemId]: {
            itemId: action.payload.itemId,
            prices: action.payload.prices,
            lastUpdated: new Date().toISOString(),
            loading: false,
            error: null,
          },
        },
      };

    case "SET_HISTORY":
      return {
        ...state,
        historicalData: {
          ...state.historicalData,
          [action.payload.itemId]: {
            itemId: action.payload.itemId,
            history: action.payload.history,
            lastUpdated: new Date().toISOString(),
            loading: false,
            error: null,
          },
        },
      };

    case "SET_GLOBAL_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_LAST_REFRESH":
      return {
        ...state,
        lastRefresh: action.payload,
      };

    default:
      return state;
  }
}

interface MarketContextType {
  state: MarketState;
  addItem: (itemId: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refreshPrices: () => Promise<void>;
  refreshHistory: (itemIds?: string[], daysBack?: number) => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(marketReducer, initialState);

  // Load tracked items from storage on mount
  useEffect(() => {
    loadTrackedItems();
  }, []);

  const loadTrackedItems = async () => {
    try {
      const stored = await AsyncStorage.getItem("trackedItems");
      if (stored) {
        const items = JSON.parse(stored);
        dispatch({ type: "SET_TRACKED_ITEMS", payload: items });
      }
    } catch (error) {
      console.error("Error loading tracked items:", error);
    }
  };

  const saveTrackedItems = async (items: TrackedItem[]) => {
    try {
      await AsyncStorage.setItem("trackedItems", JSON.stringify(items));
    } catch (error) {
      console.error("Error saving tracked items:", error);
    }
  };

  const addItem = async (itemId: string) => {
    try {
      dispatch({ type: "SET_GLOBAL_LOADING", payload: true });

      // Fetch prices for the new item
      const prices = await fetchCurrentPrices([itemId]);

      // Parse item info
      const { tier, name } = parseItemId(itemId);

      // Create tracked item
      const trackedItem: TrackedItem = {
        id: `${itemId}-${Date.now()}`,
        itemId,
        name,
        tier,
        addedAt: new Date().toISOString(),
      };

      // Add to state
      dispatch({ type: "ADD_ITEM", payload: trackedItem });
      dispatch({ type: "SET_PRICES", payload: { itemId, prices } });

      // Save to storage
      const updatedItems = [...state.trackedItems, trackedItem];
      await saveTrackedItems(updatedItems);

      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add item";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
      throw error;
    }
  };

  const removeItem = async (id: string) => {
    try {
      dispatch({ type: "REMOVE_ITEM", payload: id });
      const updatedItems = state.trackedItems.filter((item) => item.id !== id);
      await saveTrackedItems(updatedItems);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const refreshPrices = async () => {
    try {
      dispatch({ type: "SET_GLOBAL_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const itemIds = state.trackedItems.map((item) => item.itemId);
      if (itemIds.length === 0) {
        dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
        return;
      }

      const prices = await fetchCurrentPrices(itemIds);

      // Group prices by item ID
      const groupedByItem = prices.reduce(
        (acc, price) => {
          if (!acc[price.item_id]) {
            acc[price.item_id] = [];
          }
          acc[price.item_id].push(price);
          return acc;
        },
        {} as Record<string, PriceData[]>
      );

      // Update state for each item
      Object.entries(groupedByItem).forEach(([itemId, itemPrices]) => {
        dispatch({ type: "SET_PRICES", payload: { itemId, prices: itemPrices } });
      });

      dispatch({ type: "SET_LAST_REFRESH", payload: new Date().toISOString() });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh prices";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
      console.error("Error refreshing prices:", error);
    }
  };

  const refreshHistory = async (itemIds?: string[], daysBack: number = 7) => {
    try {
      const ids = itemIds || state.trackedItems.map((item) => item.itemId);
      if (ids.length === 0) return;

      dispatch({ type: "SET_GLOBAL_LOADING", payload: true });

      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const history = await fetchHistoricalPrices(ids, startDate, endDate);

      // Group history by location (city)
      const groupedByLocation = history.reduce(
        (acc, item) => {
          if (!acc[item.location]) {
            acc[item.location] = [];
          }
          acc[item.location].push(item);
          return acc;
        },
        {} as Record<string, HistoricalPrice[]>
      );

      // Update state for each location
      Object.entries(groupedByLocation).forEach(([location, locationHistory]) => {
        dispatch({ type: "SET_HISTORY", payload: { itemId: location, history: locationHistory } });
      });

      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    } catch (error) {
      console.error("Error refreshing history:", error);
      dispatch({ type: "SET_GLOBAL_LOADING", payload: false });
    }
  };

  return (
    <MarketContext.Provider value={{ state, addItem, removeItem, refreshPrices, refreshHistory }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}
