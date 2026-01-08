import { FlatList, RefreshControl, Text, View, TouchableOpacity, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useMarket } from "@/lib/context/market-context";
import { useColors } from "@/hooks/use-colors";
import { getBlackMarketSellPrice, getCityPricesSorted } from "@/lib/api/albion-api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface PriceByQuality {
  quality: number;
  buyPrice: number;
  sellPrice: number;
}

interface CityPrices {
  city: string;
  prices: PriceByQuality[];
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { state } = useMarket();
  const [refreshing, setRefreshing] = useState(false);

  if (!itemId) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">Item not found</Text>
      </ScreenContainer>
    );
  }

  const marketData = state.marketData[itemId];
  const prices = marketData?.prices || [];
  const trackedItem = state.trackedItems.find((item) => item.itemId === itemId);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh logic would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  // Get Black Market sell price
  const blackMarketPrice = getBlackMarketSellPrice(prices);

  // Get city prices sorted by buy price
  const citySortedPrices = getCityPricesSorted(prices);

  // Group prices by city and quality
  const groupedByCity: Record<string, CityPrices> = {};
  prices.forEach((price) => {
    if (!groupedByCity[price.city]) {
      groupedByCity[price.city] = {
        city: price.city,
        prices: [],
      };
    }
    groupedByCity[price.city].prices.push({
      quality: price.quality,
      buyPrice: price.buy_price_max,
      sellPrice: price.sell_price_min,
    });
  });

  const cityList = Object.values(groupedByCity);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              T{trackedItem?.tier} {trackedItem?.name}
            </Text>
            <Text className="text-xs text-muted mt-1">{itemId}</Text>
          </View>
        </View>

        {/* Black Market Sell Price */}
        {blackMarketPrice && (
          <View className="p-4 bg-primary/10 border-b border-primary mx-4 mt-4 rounded-lg">
            <Text className="text-sm text-muted mb-2">Black Market Sell Price</Text>
            <Text className="text-3xl font-bold text-primary">
              {blackMarketPrice.price.toLocaleString()}
            </Text>
            <Text className="text-xs text-muted mt-1">Quality: {blackMarketPrice.quality}</Text>
          </View>
        )}

        {/* City Comparison */}
        <View className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-3">City Prices</Text>

          {citySortedPrices.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-muted">No price data available</Text>
            </View>
          ) : (
            citySortedPrices.map((cityPrice, index) => (
              <Pressable
                key={`${cityPrice.city}-${index}`}
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
                  <Text className="text-lg font-semibold text-foreground">{cityPrice.city}</Text>
                  {blackMarketPrice && (
                    <View className="bg-success/20 rounded px-2 py-1">
                      <Text className="text-xs font-semibold text-success">
                        +{(blackMarketPrice.price - cityPrice.buyPrice).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-background rounded-lg p-3">
                    <Text className="text-xs text-muted mb-1">Buy Price</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {cityPrice.buyPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1 bg-background rounded-lg p-3">
                    <Text className="text-xs text-muted mb-1">Sell Price</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {cityPrice.sellPrice.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* All Cities Detailed View */}
        {cityList.length > 0 && (
          <View className="p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">All Prices by Quality</Text>

            {cityList.map((cityData) => (
              <View key={cityData.city} className="mb-4">
                <Text className="text-base font-semibold text-foreground mb-2">{cityData.city}</Text>
                {cityData.prices.map((priceData, idx) => (
                  <View
                    key={`${cityData.city}-q${priceData.quality}-${idx}`}
                    className="bg-surface rounded-lg p-3 mb-2 flex-row justify-between items-center border border-border"
                  >
                    <View className="flex-1">
                      <Text className="text-sm text-muted">Quality {priceData.quality}</Text>
                      <View className="flex-row gap-2 mt-1">
                        <Text className="text-xs text-foreground">
                          Buy: {priceData.buyPrice.toLocaleString()}
                        </Text>
                        <Text className="text-xs text-muted">|</Text>
                        <Text className="text-xs text-foreground">
                          Sell: {priceData.sellPrice.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
