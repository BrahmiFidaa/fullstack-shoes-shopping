import { NavigationContainer } from "@react-navigation/native";
import ProductDetailsScreen from "./screens/ProductDetailsScreen";
import ProductScreen from "./screens/ProductScreen";
import ShoppingCart from "./screens/ShoppingCart";
import CheckoutScreen from "./screens/CheckoutScreen";
import OrderDetailsScreen from "./screens/OrderDetailsScreen";
import AdminDashboard from "./screens/AdminDashboard";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { restoreAuth } from "./store/authSlice";
import * as Linking from 'expo-linking';
import React from 'react';
import { isLocalAdminEnvironment } from './utils/environment';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      Products: '',
      Login: 'login',
      Cart: 'cart',
      Profile: 'profile',
      Admin: 'admin',
      ProductDetails: 'product/:id',
    },
  },
};

const Navigation = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const isAdmin = user?.user?.isAdmin;
  const isLocalHost = React.useMemo(() => isLocalAdminEnvironment(), []);

  React.useEffect(() => {
    console.log('[Navigation] Component mounted, attempting to restore auth...');
    dispatch(restoreAuth());
  }, [dispatch]);

  React.useEffect(() => {
    console.log('[Navigation] Auth state changed - isAuthenticated:', isAuthenticated, 'user:', user?.user?.username);
  }, [isAuthenticated, user]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: '600' },
        }}
        initialRouteName="Products"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Products"
          component={ProductScreen}
          options={({ navigation }) => ({
            title: 'Shop',
            headerLeft: () => null,
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginRight: 15 }}>
                {isAuthenticated && isAdmin && isLocalHost && (
                  <Pressable onPress={() => navigation.navigate('Admin')}>
                    <Text style={{ fontWeight: 'bold', color: '#007AFF', marginRight: 15 }}>Admin</Text>
                  </Pressable>
                )}
                {isAuthenticated && (
                  <Pressable onPress={() => navigation.navigate('Profile')}>
                    <FontAwesome5 name='user-circle' size={22} color='#000' />
                  </Pressable>
                )}
                {!isAuthenticated && (
                  <Pressable onPress={() => navigation.navigate('Login')}>
                    <Text style={{ fontWeight: '600', color: '#007AFF', marginRight: 5 }}>Login</Text>
                  </Pressable>
                )}
                <Pressable 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  onPress={() => navigation.navigate('Cart')}
                >
                  <FontAwesome5 name='shopping-cart' size={18} color='#000' />
                  {cartItems.length > 0 && (
                    <Text style={{ fontWeight: '600', color: '#000' }}>{cartItems.length}</Text>
                  )}
                </Pressable>
              </View>
            )
          })}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'My Profile' }}
        />
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={{ 
            presentation: 'modal',
            title: 'Product Details',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen 
          name="Cart" 
          component={ShoppingCart}
          options={{ title: 'Shopping Cart', headerBackTitleVisible: false }}
        />
        <Stack.Screen 
          name="Checkout" 
          component={CheckoutScreen}
          options={{ title: 'Checkout', headerBackTitleVisible: false }}
        />
        <Stack.Screen 
          name="OrderDetails" 
          component={OrderDetailsScreen}
          options={{ title: 'Order Details', headerBackTitleVisible: false }}
        />
        {isAuthenticated && isAdmin && isLocalHost && (
          <Stack.Screen 
            name="Admin" 
            component={AdminDashboard}
            options={{ title: 'Admin Dashboard', headerBackTitleVisible: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;