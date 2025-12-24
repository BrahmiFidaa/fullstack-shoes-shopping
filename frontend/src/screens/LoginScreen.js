import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, signupUser, clearError } from '../store/authSlice';
import { fetchCart } from '../store/cartSlice';
import { isLocalAdminEnvironment } from '../utils/environment';

const LoginScreen = ({ navigation }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const allowAdminShell = useMemo(() => isLocalAdminEnvironment(), []);
  const adminWarningShownRef = useRef(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Login] ✅ User authenticated:', user?.user?.username, 'isAdmin:', user?.user?.isAdmin);
      // Fetch cart for the logged-in user
      dispatch(fetchCart());
      
      if (user?.user?.isAdmin) {
        console.log('[Login] Redirecting to Admin panel (local env?):', allowAdminShell);
        if (allowAdminShell) {
          navigation.replace('Admin');
        } else {
          if (!adminWarningShownRef.current) {
            Alert.alert(
              'Admin tools unavailable',
              'Admin pages can only be opened from a local network / localhost session.'
            );
            adminWarningShownRef.current = true;
          }
          navigation.replace('Products');
        }
      } else {
        // Go back if possible, otherwise go to Products
        if (navigation.canGoBack()) {
          console.log('[Login] Navigating back');
          navigation.goBack();
        } else {
          console.log('[Login] Redirecting to Products');
          navigation.replace('Products');
        }
      }
    }
  }, [isAuthenticated, user, navigation, dispatch, allowAdminShell]);

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    dispatch(loginUser({ username, password }));
  };

  const handleSignup = () => {
    if (!username || !password || !email || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    dispatch(signupUser({ 
      username, 
      password, 
      email, 
      firstName, 
      lastName 
    }));
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Coming Soon', 'Google Sign-In will be available soon');
  };

  const handleTestLogin = () => {
    dispatch(loginUser({ username: 'testuser', password: 'password123' }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>{isSignup ? 'Create your account' : 'Sign in to continue'}</Text>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, !isSignup && styles.activeTab]}
            onPress={() => {
              setIsSignup(false);
              setEmail('');
              setFirstName('');
              setLastName('');
            }}
          >
            <Text style={[styles.tabText, !isSignup && styles.activeTabText]}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, isSignup && styles.activeTab]}
            onPress={() => {
              setIsSignup(true);
              setPassword('');
              setUsername('');
            }}
          >
            <Text style={[styles.tabText, isSignup && styles.activeTabText]}>Sign Up</Text>
          </Pressable>
        </View>

        {/* Login Form */}
        {!isSignup ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </Pressable>

            <Pressable
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={handleTestLogin}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Test Login (testuser)</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.signupRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#000',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
