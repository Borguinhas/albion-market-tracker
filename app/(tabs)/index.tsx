import { FlatList, RefreshControl, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useMarket } from "@/lib/context/market-context";
import { useColors } from "@/hooks/use-colors";
import { getAveragePrice, findBestPrices } from "@/lib/api/albion-api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ItemCardProps {
  itemId: string;
  name: string;
  tier: number;
  prices: any[];
  onPress: () => void;
}

function ItemCard({ itemId, name, tier, prices, onPress }: ItemCardProps) {
  const colors = useColors();
  const avgPrice = getAveragePrice(prices);
  const { bestBuy, bestSell } = findBestPrices(prices);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">
            T{tier} {name}
          </Text>
          <Text className="text-xs text-muted mt-1">{itemId}</Text>
        </View>
        <View className="bg-primary rounded-full px-3 py-1">
          <Text className="text-white text-xs font-semibold">Tier {tier}</Text>
        </View>
      </View>

      <View className="bg-background rounded-lg p-3 mb-3">
        <Text className="text-xs text-muted mb-1">Average Price</Text>
        <Text className="text-2xl font-bold text-foreground">{avgPrice.toLocaleString()}</Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-success/10 rounded-lg p-2">
          <Text className="text-xs text-muted">Best Buy</Text>
          <Text className="text-sm font-semibold text-success">
            {bestBuy.city} @ {bestBuy.price}
          </Text>
        </View>
        <View className="flex-1 bg-warning/10 rounded-lg p-2">
          <Text className="text-xs text-muted">Best Sell</Text>
          <Text className="text-sm font-semibold text-warning">
            {bestSell.city} @ {bestSell.price}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, refreshPrices } = useMarket();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPrices();
    setRefreshing(false);
  };

  useEffect(() => {
    // Initial load
    if (state.trackedItems.length > 0 && Object.keys(state.marketData).length === 0) {
      refreshPrices();
    }
  }, []);

  const handleAddItem = () => {
    router.push("/add-item");
  };

  const handleItemPress = (itemId: string) => {
    router.push({
      pathname: "/item-detail",
      params: { itemId },
    });
  };

  return (
    <ScreenContainer className="flex-1 p-4">
      {state.trackedItems.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4">
          <MaterialIcons name="shopping-bag" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground">No Items Tracked</Text>
          <Text className="text-sm text-muted text-center px-4">
            Add items to track their prices across different cities
          </Text>
          <TouchableOpacity
            onPress={handleAddItem}
            className="bg-primary rounded-full px-6 py-3 mt-4"
          >
            <Text className="text-white font-semibold">Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={state.trackedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const marketData = state.marketData[item.itemId];
            const prices = marketData?.prices || [];

            return (
              <ItemCard
                itemId={item.itemId}
                name={item.name}
                tier={item.tier}
                prices={prices}
                onPress={() => handleItemPress(item.itemId)}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || state.loading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-3xl font-bold text-foreground">Market Tracker</Text>
                {state.lastRefresh && (
                  <Text className="text-xs text-muted mt-1">
                    Updated: {new Date(state.lastRefresh).toLocaleTimeString()}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={handleAddItem}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialIcons name="add" size={24} color="white" />
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-muted">No items to display</Text>
            </View>
          }
          scrollEnabled={true}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}

      {state.error && (
        <View className="bg-error/10 border border-error rounded-lg p-3 mt-4">
          <Text className="text-error text-sm">{state.error}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
