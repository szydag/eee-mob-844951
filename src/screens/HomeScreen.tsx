import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// --- CONFIGURATION & TYPES ---
// WARNING: Use your specific local IP or emulator loopback (10.0.2.2 for Android default emulator) 
const API_URL = 'http://10.0.2.2:3000/api/tasks'; 
const THEME = {
  primary: '#2563EB',
  success: '#10B981',
  secondary: '#F3F4F6',
  textLight: '#FFFFFF',
  textDark: '#1F2937',
};

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'home'>;

// --- Components ---

const AppHeader: React.FC<{ title: string; color: string; textColor: string }> = ({ title, color, textColor }) => (
  <View style={[styles.header, { backgroundColor: color }]}>
    <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
  </View>
);

const SearchBar: React.FC<{ placeholder: string; onChangeText: (text: string) => void }> = ({ placeholder, onChangeText }) => (
  <View style={styles.searchContainer}>
    <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor="#6B7280"
      onChangeText={onChangeText}
    />
  </View>
);

const FAB: React.FC<{ icon: string; color: string; action: () => void }> = ({ icon, color, action }) => (
  <TouchableOpacity style={[styles.fab, { backgroundColor: color }]} onPress={action}>
    <Icon name={icon} size={28} color={THEME.textLight} />
  </TouchableOpacity>
);

interface TodoItemProps {
  item: Task;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (item: Task) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ item, onEdit, onDelete, onToggleComplete }) => {
  
  // Helper to format due date string (optional)
  const getFormattedDate = (isoDate?: string) => {
    if (!isoDate) return null;
    try {
        return new Date(isoDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'Tarih Belirtilmemiş';
    }
  };

  return (
    <View style={styles.listItem}>
      <TouchableOpacity onPress={() => onToggleComplete(item)} style={styles.checkboxContainer}>
        <Icon 
          name={item.isCompleted ? "check-box" : "check-box-outline-blank"} 
          size={24} 
          color={item.isCompleted ? THEME.success : '#9CA3AF'} 
        />
      </TouchableOpacity>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, item.isCompleted && styles.completedText]}>
          {item.title}
        </Text>
        {item.dueDate && (
            <Text style={styles.itemDate}>
                Bitiş: {getFormattedDate(item.dueDate)}
            </Text>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.actionButton}>
          <Icon name="edit" size={20} color={THEME.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionButton}>
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Main Screen ---

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL); 
      setTasks(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Hata", "Görevler yüklenirken bir sorun oluştu. Backend çalışıyor mu?");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );
  
  const handleToggleComplete = async (task: Task) => {
    try {
        await axios.put(`${API_URL}/${task.id}`, { is_completed: !task.isCompleted });
        fetchTasks();
    } catch (error) {
        Alert.alert("Hata", "Görevin durumunu güncellerken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
        "Görevi Sil",
        "Bu görevi silmek istediğinizden emin misiniz?",
        [
            { text: "İptal", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/${id}`);
                        fetchTasks();
                    } catch (error) {
                        Alert.alert("Hata", "Görev silinirken hata oluştu.");
                    }
                }
            }
        ]
    );
  };
  
  const handleEdit = (id: string) => {
    navigation.navigate('add_edit', { taskId: id });
  };

  const handleAdd = () => {
    navigation.navigate('add_edit', undefined);
  };
  
  // Filtering logic for the list based on search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (task.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
      // Sort incomplete tasks first
      if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
      }
      // Then sort by creation date (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader 
        title="EEE Yapılacaklar" 
        color={THEME.primary} 
        textColor={THEME.textLight} 
      />
      <View style={styles.content}>
        <SearchBar 
          placeholder="Görev ara..." 
          onChangeText={setSearchQuery} 
        />
        
        {loading ? (
          <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 20 }} />
        ) : filteredTasks.length === 0 && tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="list-alt" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz görev yok. Yeni bir görev ekleyin!</Text>
          </View>
        ) : filteredTasks.length === 0 && searchQuery ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>\"{searchQuery}\" ile eşleşen görev bulunamadı.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TodoItem 
                item={item} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      
      <FAB 
        icon="add" 
        color={THEME.primary} 
        action={handleAdd} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.secondary,
  },
  header: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.textLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 80, 
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: THEME.textLight,
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  checkboxContainer: {
    paddingRight: 10,
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textDark,
  },
  itemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    padding: 5,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  }
});

export default HomeScreen;