import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useMarket } from "@/lib/context/market-context";
import { useColors } from "@/hooks/use-colors";
import { parseItemId, PriceData } from "@/lib/api/albion-api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface CityPriceRow {
  city: string;
  quality: number;
  buyMin: number;
  buyMax: number;
  sellMin: number;
  sellMax: number;
}

function CityPriceCard({ city, quality, buyMin, buyMax, sellMin, sellMax }: CityPriceRow) {
  const colors = useColors();
  const profitMargin = sellMin > 0 && buyMax > 0 ? ((sellMin - buyMax) / buyMax) * 100 : 0;

  return (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-lg font-semibold text-foreground">{city}</Text>
          <Text className="text-xs text-muted">Quality {quality}</Text>
        </View>
        {profitMargin > 0 && (
          <View className="bg-success/20 rounded-full px-3 py-1">
            <Text className="text-success text-xs font-semibold">+{profitMargin.toFixed(1)}%</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Buy Price</Text>
          <Text className="text-sm font-semibold text-foreground">
            {buyMin > 0 ? buyMin.toLocaleString() : "-"}
          </Text>
          {buyMax > buyMin && (
            <Text className="text-xs text-muted">
              to {buyMax > 0 ? buyMax.toLocaleString() : "-"}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Sell Price</Text>
          <Text className="text-sm font-semibold text-foreground">
            {sellMin > 0 ? sellMin.toLocaleString() : "-"}
          </Text>
          {sellMax > sellMin && (
            <Text className="text-xs text-muted">
              to {sellMax > 0 ? sellMax.toLocaleString() : "-"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const itemId = params.itemId as string;
  const { state, refreshPrices, refreshHistory } = useMarket();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  const { tier, name } = parseItemId(itemId);
  const marketData = state.marketData[itemId];
  const prices = marketData?.prices || [];

  useEffect(() => {
    if (!prices || prices.length === 0) {
      refreshPrices([itemId]);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPrices([itemId]);
    setRefreshing(false);
  };

  // Group prices by city and quality
  const groupedPrices: Record<string, Record<number, PriceData>> = {};
  prices.forEach((price) => {
    if (!groupedPrices[price.city]) {
      groupedPrices[price.city] = {};
    }
    groupedPrices[price.city][price.quality] = price;
  });

  // Get unique qualities
  const qualities = Array.from(new Set(prices.map((p) => p.quality))).sort();

  // Filter prices by selected quality or show all
  const filteredGroupedPrices = Object.entries(groupedPrices).reduce(
    (acc, [city, qualityMap]) => {
      if (selectedQuality !== null) {
        if (qualityMap[selectedQuality]) {
          acc[city] = { [selectedQuality]: qualityMap[selectedQuality] };
        }
      } else {
        acc[city] = qualityMap;
      }
      return acc;
    },
    {} as Record<string, Record<number, PriceData>>
  );

  // Convert to flat list
  const priceRows: CityPriceRow[] = [];
  Object.entries(filteredGroupedPrices).forEach(([city, qualityMap]) => {
    Object.entries(qualityMap).forEach(([quality, price]) => {
      priceRows.push({
        city,
        quality: parseInt(quality, 10),
        buyMin: price.buy_price_min,
        buyMax: price.buy_price_max,
        sellMin: price.sell_price_min,
        sellMax: price.sell_price_max,
      });
    });
  });

  return (
    <ScreenContainer className="flex-1 p-4">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing || state.loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center mb-4 gap-2">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              T{tier} {name}
            </Text>
            <Text className="text-xs text-muted">{itemId}</Text>
          </View>
        </View>

        {/* Quality Filter */}
        {qualities.length > 1 && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Quality</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedQuality(null)}
                style={({ pressed }) => [
                  {
                    backgroundColor: selectedQuality === null ? colors.primary : colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: selectedQuality === null ? 0 : 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedQuality === null ? "text-white" : "text-foreground"
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {qualities.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => setSelectedQuality(q)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: selectedQuality === q ? colors.primary : colors.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: selectedQuality === q ? 0 : 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedQuality === q ? "text-white" : "text-foreground"
                    }`}
                  >
                    Q{q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Price List */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-3">Prices by City</Text>
          {priceRows.length > 0 ? (
            priceRows.map((row, idx) => (
              <CityPriceCard key={`${row.city}-${row.quality}-${idx}`} {...row} />
            ))
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="text-muted">No price data available</Text>
            </View>
          )}
        </View>

        {marketData?.lastUpdated && (
          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-xs text-muted text-center">
              Last updated: {new Date(marketData.lastUpdated).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
