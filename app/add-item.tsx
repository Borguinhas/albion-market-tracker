import { FlatList, Text, View, TextInput, TouchableOpacity, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useMarket } from "@/lib/context/market-context";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Available items from the API
const AVAILABLE_ITEMS = [
  "T4_BAG",
  "T5_BAG",
  "T6_BAG",
  "T7_BAG",
  "T8_BAG",
  "T4_ARMOR_CLOTH",
  "T5_ARMOR_CLOTH",
  "T6_ARMOR_CLOTH",
  "T4_ARMOR_LEATHER",
  "T5_ARMOR_LEATHER",
  "T6_ARMOR_LEATHER",
  "T4_ARMOR_PLATE",
  "T5_ARMOR_PLATE",
  "T6_ARMOR_PLATE",
  "T4_WEAPON_SWORD",
  "T5_WEAPON_SWORD",
  "T6_WEAPON_SWORD",
  "T4_WEAPON_AXE",
  "T5_WEAPON_AXE",
  "T6_WEAPON_AXE",
];

interface ItemOption {
  id: string;
  tier: number;
  name: string;
}

function parseItems(items: string[]): ItemOption[] {
  return items.map((item) => {
    const match = item.match(/T(\d+)_(.*)/);
    if (match) {
      return {
        id: item,
        tier: parseInt(match[1], 10),
        name: match[2].replace(/_/g, " "),
      };
    }
    return { id: item, tier: 0, name: item };
  });
}

function ItemOptionCard({
  item,
  isSelected,
  onPress,
}: {
  item: ItemOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: isSelected ? 0 : 1,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
      ]}
    >
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>
          T{item.tier} {item.name}
        </Text>
        <Text className={`text-xs mt-1 ${isSelected ? "text-white/70" : "text-muted"}`}>
          {item.id}
        </Text>
      </View>
      {isSelected && <MaterialIcons name="check-circle" size={24} color="white" />}
    </Pressable>
  );
}

export default function AddItemScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addItem, state } = useMarket();
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const items = parseItems(AVAILABLE_ITEMS);
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddItems = async () => {
    for (const itemId of selectedItems) {
      await addItem(itemId);
    }
    router.back();
  };

  const trackedItemIds = state.trackedItems.map((item) => item.itemId);
  const availableItems = filteredItems.filter((item) => !trackedItemIds.includes(item.id));

  return (
    <ScreenContainer className="flex-1 p-4">
      <View className="flex-row items-center mb-4 gap-2">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground flex-1">Add Items</Text>
      </View>

      <View className="flex-row items-center bg-surface rounded-lg px-4 py-2 mb-4 border border-border">
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          placeholder="Search items..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-2 text-foreground"
        />
      </View>

      <FlatList
        data={availableItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemOptionCard
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onPress={() => toggleItem(item.id)}
          />
        )}
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-muted">No items found</Text>
          </View>
        }
      />

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-1 border border-border rounded-lg py-3"
        >
          <Text className="text-center font-semibold text-foreground">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddItems}
          disabled={selectedItems.length === 0}
          className={`flex-1 rounded-lg py-3 ${
            selectedItems.length === 0 ? "bg-muted" : "bg-primary"
          }`}
        >
          <Text className="text-center font-semibold text-white">
            Add {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
