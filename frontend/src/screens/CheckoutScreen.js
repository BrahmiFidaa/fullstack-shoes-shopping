import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { orderAPI } from '../services/api';
import { clearCart } from '../store/cartSlice';

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const userId = useSelector(state => state.auth.user?.user?.id);
  const user = useSelector(state => state.auth.user?.user);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test Street',
    city: 'Test City',
    state: 'TC',
    zipCode: '12345',
  });
  
  const [errors, setErrors] = useState({});
  const [cardData, setCardData] = useState({
    cardNumber: '4111111111111111',
    cardholderName: 'Test User',
    expiryDate: '12/25',
    cvv: '123',
  });
  const [cardErrors, setCardErrors] = useState({});

  // Pre-fill form with user data from profile
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        firstName: user.firstName || 'Test',
        lastName: user.lastName || 'User',
        email: user.email || 'test@example.com',
        phone: user.phone || '1234567890',
      }));
    }
  }, [user]);

  // Validation helpers
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\-\(\)\s]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10;
  };

  const validateZipCode = (zip) => {
    const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
    return zipRegex.test(zip);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0).toFixed(2);
  };

  // Card validation helpers
  const validateCardNumber = (cardNum) => {
    const cleanCard = cardNum.replace(/\s+/g, '');
    return /^\d{13,19}$/.test(cleanCard);
  };

  const validateExpiryDate = (expiry) => {
    const pattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!pattern.test(expiry)) return false;
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);
    
    return expiryYear > currentYear || (expiryYear === currentYear && expiryMonth >= currentMonth);
  };

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateCardForm = () => {
    const newCardErrors = {};

    if (!cardData.cardNumber.trim()) {
      newCardErrors.cardNumber = 'Card number is required';
    } else if (!validateCardNumber(cardData.cardNumber)) {
      newCardErrors.cardNumber = 'Enter a valid card number (13-19 digits)';
    }

    if (!cardData.cardholderName.trim()) {
      newCardErrors.cardholderName = 'Cardholder name is required';
    } else if (cardData.cardholderName.trim().length < 3) {
      newCardErrors.cardholderName = 'Cardholder name must be at least 3 characters';
    }

    if (!cardData.expiryDate.trim()) {
      newCardErrors.expiryDate = 'Expiry date is required';
    } else if (!validateExpiryDate(cardData.expiryDate)) {
      newCardErrors.expiryDate = 'Enter valid expiry date (MM/YY), not expired';
    }

    if (!cardData.cvv.trim()) {
      newCardErrors.cvv = 'CVV is required';
    } else if (!validateCVV(cardData.cvv)) {
      newCardErrors.cvv = 'CVV must be 3-4 digits';
    }

    setCardErrors(newCardErrors);
    return Object.keys(newCardErrors).length === 0;
  };

  // Simulate payment verification API call
  const verifyPayment = async (cardInfo) => {
    try {
      console.log('[Payment] Verifying card with payment gateway...');
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In testing mode, always return true
      console.log('[Payment] ✅ Card verified successfully');
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      console.error('[Payment] ❌ Payment verification failed:', error);
      return {
        success: false,
        message: 'Payment failed. Please try again.',
      };
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    if (!validateCardForm()) {
      Alert.alert('Card Validation Error', 'Please fix the payment details');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before checkout');
      return;
    }

    setLoading(true);

    try {
      console.log('[Checkout] Verifying payment...');
      
      // Verify payment with card
      const paymentResult = await verifyPayment({
        cardNumber: cardData.cardNumber,
        cardholderName: cardData.cardholderName,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
      });

      if (!paymentResult.success) {
        Alert.alert('Payment Failed', paymentResult.message);
        setLoading(false);
        return;
      }

      console.log('[Checkout] Submitting order...');
      
      // Combine name and address for order creation
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;

      const response = await orderAPI.create({
        shippingAddress: fullAddress,
        phoneNumber: formData.phone,
      });

      console.log('[Checkout] ✅ Order created:', response.data.orderNumber);
      
      // Clear cart after successful order
      dispatch(clearCart());

      // Navigate back to Products screen
      navigation.navigate('Products');
      
      // Show success toast/notification
      setTimeout(() => {
        Alert.alert(
          'Order Successful!',
          `Order #${response.data.orderNumber} has been placed!\nTotal: $${response.data.totalAmount.toFixed(2)}`,
          [{ text: 'OK' }]
        );
      }, 500);
    } catch (error) {
      console.error('[Checkout] Error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create order';
      Alert.alert('Checkout Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderFormField = (label, field, placeholder, keyboardType = 'default') => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, errors[field] && styles.inputError]}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          keyboardType={keyboardType}
          editable={!loading}
        />
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.spacer} />
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.itemName}>{item.product?.name}</Text>
              <Text style={styles.itemQuantity}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                ${(item.product?.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>${calculateTotal()}</Text>
          </View>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.formRow}>
            {renderFormField('First Name', 'firstName', 'John')}
            {renderFormField('Last Name', 'lastName', 'Doe')}
          </View>

          {renderFormField('Email', 'email', 'john@example.com', 'email-address')}
          {renderFormField('Phone', 'phone', '(555) 123-4567', 'phone-pad')}
          {renderFormField('Address', 'address', '123 Main St')}

          <View style={styles.formRow}>
            {renderFormField('City', 'city', 'New York')}
            {renderFormField('State', 'state', 'NY')}
          </View>

          {renderFormField('ZIP Code', 'zipCode', '10001', 'numeric')}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={[styles.input, cardErrors.cardNumber && styles.inputError]}
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onChangeText={(text) => setCardData({ ...cardData, cardNumber: text })}
              keyboardType="numeric"
              maxLength={23}
              editable={!loading}
              placeholderTextColor="#999"
            />
            {cardErrors.cardNumber && (
              <Text style={styles.errorText}>{cardErrors.cardNumber}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={[styles.input, cardErrors.cardholderName && styles.inputError]}
              placeholder="John Doe"
              value={cardData.cardholderName}
              onChangeText={(text) => setCardData({ ...cardData, cardholderName: text })}
              editable={!loading}
              placeholderTextColor="#999"
            />
            {cardErrors.cardholderName && (
              <Text style={styles.errorText}>{cardErrors.cardholderName}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={[styles.input, cardErrors.expiryDate && styles.inputError]}
                placeholder="MM/YY"
                value={cardData.expiryDate}
                onChangeText={(text) => {
                  let formatted = text.replace(/\D/g, '');
                  if (formatted.length >= 2) {
                    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
                  }
                  setCardData({ ...cardData, expiryDate: formatted });
                }}
                maxLength={5}
                keyboardType="numeric"
                editable={!loading}
                placeholderTextColor="#999"
              />
              {cardErrors.expiryDate && (
                <Text style={styles.errorText}>{cardErrors.expiryDate}</Text>
              )}
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={[styles.input, cardErrors.cvv && styles.inputError]}
                placeholder="123"
                value={cardData.cvv}
                onChangeText={(text) => setCardData({ ...cardData, cvv: text })}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                editable={!loading}
                placeholderTextColor="#999"
              />
              {cardErrors.cvv && (
                <Text style={styles.errorText}>{cardErrors.cvv}</Text>
              )}
            </View>
          </View>

          <Text style={styles.testInfo}>🧪 Test Mode: Use any card details for testing</Text>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutBtnText}>
            {loading ? 'Processing...' : 'Complete Purchase'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 50,
  },
  summarySection: {
    backgroundColor: '#f9f9f9',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
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
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  checkoutBtn: {
    backgroundColor: '#34C759',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  inputError: {
    borderColor: '#cc0000',
    borderWidth: 1.5,
  },
  testInfo: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
});

export default CheckoutScreen;
