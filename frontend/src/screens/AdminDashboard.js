import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector } from 'react-redux';
import { adminAPI } from '../services/api';
import { isLocalAdminEnvironment } from '../utils/environment';

const INITIAL_FORM = {
  name: '',
  description: '',
  price: '',
  image: '',
  stockQuantity: ''
};

const AdminDashboard = ({ navigation }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isAdminUser = Boolean(user?.user?.isAdmin);
  const isLocalEnv = useMemo(() => isLocalAdminEnvironment(), []);
  const canAccess = isAuthenticated && isAdminUser && isLocalEnv;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser) {
      if (!warnedRef.current) {
        Alert.alert('Access denied', 'You must be an authenticated admin to view this page.');
        warnedRef.current = true;
      }
      navigation?.replace?.('Products');
      return;
    }

    if (!isLocalEnv) {
      if (!warnedRef.current) {
        Alert.alert('Admin tools locked', 'Admin screens can only be opened from localhost or a private network during development.');
        warnedRef.current = true;
      }
      navigation?.replace?.('Products');
    }
  }, [isAuthenticated, isAdminUser, isLocalEnv, navigation]);

  const loadDashboardData = useCallback(async () => {
    if (!canAccess) {
      return;
    }
    setLoading(true);
    try {
      const [dashData, productsData, usersData, ordersData, logsData] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllProducts(),
        adminAPI.getAllUsers(),
        adminAPI.getAllOrders(),
        adminAPI.getAllLogs()
      ]);

      setStats(dashData.data || {});
      setProducts(productsData.data || []);
      setUsers(usersData.data || []);
      setOrders(ordersData.data || []);
      setLogs(logsData.data || []);
    } catch (error) {
      console.error('[AdminDashboard] Failed to load data', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load admin data. Pull to refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  useEffect(() => {
    if (canAccess) {
      loadDashboardData();
    }
  }, [canAccess, loadDashboardData]);

  useEffect(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    if (lowStockOnly) {
      filtered = filtered.filter((product) => Number(product.stockQuantity) < 10);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price') {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === 'stock') {
        return Number(a.stockQuantity) - Number(b.stockQuantity);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, sortBy, lowStockOnly]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      image: product.image || '',
      stockQuantity: String(product.stockQuantity ?? '')
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stockQuantity) {
      Alert.alert('Validation error', 'Name, price and stock quantity are required.');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image: formData.image,
      stockQuantity: parseInt(formData.stockQuantity, 10)
    };

    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, payload);
        Alert.alert('Success', 'Product updated successfully.');
      } else {
        await adminAPI.createProduct(payload);
        Alert.alert('Success', 'Product created successfully.');
      }
      setShowProductModal(false);
      setFormData(INITIAL_FORM);
      setEditingProduct(null);
      loadDashboardData();
    } catch (error) {
      console.error('[AdminDashboard] Failed to save product', error.response?.data || error.message);
      Alert.alert('Error', 'Unable to save product. Please try again.');
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteProduct(productId);
              Alert.alert('Deleted', 'Product removed successfully.');
              loadDashboardData();
            } catch (error) {
              console.error('[AdminDashboard] Failed to delete product', error.response?.data || error.message);
              Alert.alert('Error', 'Unable to delete product.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status);
      Alert.alert('Updated', `Order #${orderId} marked as ${status}.`);
      loadDashboardData();
    } catch (error) {
      console.error('[AdminDashboard] Failed to update order status', error.response?.data || error.message);
      Alert.alert('Error', 'Unable to update order status.');
    }
  };

  const lowStockCount = products.filter((product) => Number(product.stockQuantity) < 10).length;

  if (!canAccess) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedTitle}>Admin access restricted</Text>
        <Text style={styles.lockedSubtitle}>
          Sign in as an admin from localhost / a private IP to unlock these tools.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshBtnText}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {['dashboard', 'products', 'users', 'orders', 'logs'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Statistics Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('Total Users', stats?.totalUsers || 0, '#007AFF')}
              {renderStatCard('Total Products', stats?.totalProducts || 0, '#34C759')}
              {renderStatCard('Total Orders', stats?.totalOrders || 0, '#FF9500')}
              {renderStatCard('Total Logs', stats?.totalLogs || 0, '#FF3B30')}
            </View>
          </View>
        )}

        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products ({filteredProducts.length})</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddProduct}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterBtn, lowStockOnly && styles.filterBtnActive]}
                onPress={() => setLowStockOnly((prev) => !prev)}
              >
                <Text style={[styles.filterBtnText, lowStockOnly && styles.filterBtnTextActive]}>Low stock</Text>
              </TouchableOpacity>
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                {['name', 'price', 'stock'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.sortBtn, sortBy === option && styles.sortBtnActive]}
                    onPress={() => setSortBy(option)}
                  >
                    <Text style={[styles.sortBtnText, sortBy === option && styles.sortBtnTextActive]}>
                      {option.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {lowStockCount > 0 && !lowStockOnly && (
              <View style={styles.alertContainer}>
                <Text style={styles.alertText}>⚠️ {lowStockCount} product(s) have low stock.</Text>
              </View>
            )}

            {filteredProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products found.</Text>
            ) : (
              filteredProducts.map((product) => renderProductCard(product, handleEditProduct, handleDeleteProduct))
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Users ({users.length})</Text>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>No users found.</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Username</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Email</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Role</Text>
                </View>
                {users.map((u) => renderUserRow(u))}
              </>
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Orders ({orders.length})</Text>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>No orders found.</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Order #</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Total</Text>
                </View>
                {orders.map((order) => renderOrderRow(order, handleUpdateStatus))}
              </>
            )}
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Activity Logs ({logs.length})</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No logs found.</Text>
            ) : (
              logs.slice(0, 25).map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logDetails}>
                    {log.resourceType || 'Resource'} · {log.status || 'unknown'}
                  </Text>
                  <Text style={styles.logMeta}>
                    {log.user?.username || 'system'} · {new Date(log.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={formData.name}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Enter description"
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                placeholderTextColor="#999"
                multiline
              />

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { marginRight: 10 }]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={formData.price}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formData.stockQuantity}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, stockQuantity: text }))}
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={formData.image}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, image: text }))}
                placeholderTextColor="#999"
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.formBtn, styles.submitBtn]} onPress={handleSaveProduct}>
                  <Text style={styles.formBtnText}>{editingProduct ? 'Update' : 'Create'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formBtn, styles.cancelBtn]}
                  onPress={() => setShowProductModal(false)}
                >
                  <Text style={styles.formBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const renderStatCard = (title, value, color) => (
  <View key={title} style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const renderProductCard = (product, onEdit, onDelete) => (
  <View key={product.id} style={styles.productCard}>
    {product.image ? (
      <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
    ) : (
      <View style={[styles.productImage, styles.productPlaceholder]}>
        <Text style={{ fontSize: 24 }}>👟</Text>
      </View>
    )}
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
      <Text style={styles.productStock}>Stock: {product.stockQuantity}</Text>
      <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
    </View>
    <View style={styles.productActions}>
      <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => onEdit(product)}>
        <Text style={styles.actionBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(product.id)}>
        <Text style={styles.actionBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const renderUserRow = (user) => (
  <View key={user.id} style={styles.tableRow}>
    <Text style={[styles.tableCell, { flex: 1 }]}>{user.username}</Text>
    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
      {user.email}
    </Text>
    <Text style={[styles.tableCell, { flex: 1 }]}>{user.isAdmin ? 'Admin' : 'Customer'}</Text>
  </View>
);

const renderOrderRow = (order, onUpdate) => (
  <View key={order.id} style={styles.orderRow}>
    <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
      {order.orderNumber || `#${order.id}`}
    </Text>
    <Text style={[styles.tableCell, { flex: 1 }]}>{order.status}</Text>
    <Text style={[styles.tableCell, { flex: 1 }]}>${Number(order.totalAmount).toFixed(2)}</Text>
    <View style={styles.orderActions}>
      <TouchableOpacity
        style={[styles.smallActionBtn, { backgroundColor: '#27ae60' }]}
        onPress={() => onUpdate(order.id, 'DELIVERED')}
      >
        <Text style={styles.smallActionText}>Delivered</Text>
      </TouchableOpacity>
      <TouchableOpacity
            style={[styles.smallActionBtn, { backgroundColor: '#f39c12' }]}
        onPress={() => onUpdate(order.id, 'PROCESSING')}
      >
        <Text style={styles.smallActionText}>Processing</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111'
  },
  lockedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555'
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: '600'
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666'
  },
  activeTabText: {
    color: '#007AFF'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  addBtn: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  filterBtnActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500'
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333'
  },
  filterBtnTextActive: {
    color: '#fff'
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto'
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  sortBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333'
  },
  sortBtnTextActive: {
    color: '#fff'
  },
  alertContainer: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12
  },
  alertText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 30
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0'
  },
  productPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
    marginVertical: 4
  },
  productStock: {
    fontSize: 12,
    color: '#666'
  },
  productDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  productActions: {
    justifyContent: 'space-around',
    marginLeft: 12
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginVertical: 4
  },
  editBtn: {
    backgroundColor: '#007AFF'
  },
  deleteBtn: {
    backgroundColor: '#FF3B30'
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333'
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  tableCell: {
    fontSize: 13,
    color: '#333'
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 6
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto'
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4
  },
  smallActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  logCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF'
  },
  logAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333'
  },
  logDetails: {
    fontSize: 12,
    color: '#666'
  },
  logMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeBtn: {
    fontSize: 24,
    color: '#999'
  },
  formContainer: {
    padding: 16
  },
  formRow: {
    flexDirection: 'row'
  },
  formGroup: {
    flex: 1
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
    marginBottom: 12
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  submitBtn: {
    backgroundColor: '#34C759'
  },
  cancelBtn: {
    backgroundColor: '#999'
  },
  formBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default AdminDashboard;
