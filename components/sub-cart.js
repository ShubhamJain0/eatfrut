import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { TouchableNativeFeedback } from 'react-native';
import { StyleSheet, Text, View, RefreshControl, ScrollView, SafeAreaView, Image, Button, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { AntDesign, FontAwesome, MaterialIcons, Entypo, Ionicons, EvilIcons, MaterialCommunityIcons, createIconSetFromIcoMoon } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext, PushTokenContext, CartContext, SubDayContext, SubPlanContext } from './context';
import * as Location from 'expo-location';
import MapView, {Marker, AnimatedRegion, Callout, MarkerAnimated} from 'react-native-maps';
import RazorpayCheckout from 'react-native-razorpay';
import { showMessage } from 'react-native-flash-message';
import * as SecureStore from 'expo-secure-store';
import Carousel from 'react-native-snap-carousel';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import moment from 'moment';
import icoMoonConfig from '../selection.json';
import NetInfo from "@react-native-community/netinfo";
import Ripple from 'react-native-material-ripple';

export default function SubCart({ navigation }) {

    const CustomIcon = createIconSetFromIcoMoon(icoMoonConfig, 'IcoMoon');
  const screenWidth = Dimensions.get("window").width;

    const [mounted, setMounted] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [showIndic, setShowInidc] = useState(false);

  const [cartList, setCartList] = useState([]);
  const [itemPhotos, setItemPhotos] = useState([]);
  const [test, setTest] = useState([]);
  const [cartStatus, setCartStatus] = useState(0);
  const [total, setTotal] = useState(0);
  const [subMultiply, setSubMultiply] = useState(1);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [taxes, setTaxes] = useState(0);

  const [myAddresses, setMyAddresses] = useState([]);
  const [myAddressesStatus, setMyAddressesStatus] = useState(401);
  const [deliveryAddress, setDeliveryAddress] = useState([]);
  const [deliveryAddressStatus, setDeliveryAddressStatus] = useState(401);
  const [addressModal, setAddressModal] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [inputLocality, setInputLocality] = useState('');
  const [inputCity, setInputCity] = useState('Hyderabad');
  const [inputAddressType, setInputAddressType] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [couponModal, setCouponModal] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [animationModal, setAnimationModal] = useState(false);
  const [onPlace, setOnPlace] = useState(false);
  const [onPlaceLottieModal, setOnPlaceLottieModal] = useState(false);
  const [afterPaymentModal, setAfterPaymentModal] = useState(false);
  const [indicPos, setIndicPos] = useState('relative');


  const [mapDefLocation, setMapDefLocation] = useState({latitude: 17.4217697, longitude: 78.4749875, latitudeDelta: 0.1, longitudeDelta: 0.1});
  const [markerData, setMarkerData] = useState(new AnimatedRegion({latitude: 17.4217697, longitude: 78.4749875, latitudeDelta: 0.01, longitudeDelta: 0.01 }));
  const mapRef = useRef(null);


  const [error, setError] = useState('');

  const [conPushToken] = useContext(PushTokenContext);

  //Carousel, Modal, Calendar, date and time related

  const [choosenDay, setChoosenDay] = useContext(SubDayContext);

  var currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + 1)

  const [showModal, setShowModal] = useState(false);
  const [subType, setSubType] = useState('');
  const [choosenPlan, setChoosenPlan] = useContext(SubPlanContext);

  const carouselRef = useRef(null);
  const [carouselData] = useState([1, 2]);

  //For prefill-razorpay-checkout

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

    //Checks for internet connection
    useEffect(() => {
        NetInfo.fetch().then(state => {
        if (!state.isConnected) {
            setIsOffline(true);
        }
        })
    }, [])

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
        if (!state.isConnected || !state.isInternetReachable) {
            setIsOffline(true);
        } 
        })

        return () => {
            unsubscribe();
        }
    }, [])



    useEffect(() => {
            (async () => {
                const token = await SecureStore.getItemAsync('USER_TOKEN')
                if (token) {
                    fetch('http://192.168.0.156:8000/store/subsconfirm/',{
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${token}`,
                            'Content-type': 'application/json'
                        }
                    })
                    .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                    .then(resp => {if (mounted) {setCartList(resp.json.items), setTotal(resp.json.total), setCartStatus(resp.status), setItemPhotos(resp.json.photos), setTest(resp.json.custom_count)}})
                    .catch(error => setError(error))
                } else {
                    setCartStatus(401);
                }
            })().catch(error => setError(error))


            return () => {
                setMounted(false);
            }
        
    }, [])


    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('USER_TOKEN')
            if (token) {
                fetch('http://192.168.0.156:8000/store/myaddress/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setMyAddresses(resp.json), setMyAddressesStatus(resp.status)}})
                .catch(error => setError(error))
            } else {
                setCartStatus(401);
            }
        })().catch(error => setError(error))


        return () => {
            setMounted(false);
        }
    

    }, [])


    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('USER_TOKEN')
            if (token) {
                fetch('http://192.168.0.156:8000/store/getdeliveryaddress/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setDeliveryAddress(resp.json.address), setDeliveryAddressStatus(resp.status)}})
                .catch(error => setError(error))
            } else {
                setCartStatus(401);
            }
        })().catch(error => setError(error))


        return () => {
            setMounted(false);
        }

    }, [])



    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('USER_TOKEN')
            if (token) {
                fetch('http://192.168.0.156:8000/store/coupons/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setCouponList(resp.json.data)}})
                .catch(error => setError(error))
            } else {
                setCartStatus(401);
            }
        })().catch(error => setError(error))

        return () => {
            setMounted(false);
        }

    }, [])


    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('USER_TOKEN')
            if (token) {
              fetch('http://192.168.0.156:8000/api/me/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setName(resp.json.name), setEmail(resp.json.email), setPhone(resp.json.phone)}})
                .catch(error => setError(error));
            } else {
              return;
            }
          })().catch(error => setError(error))
    }, [])



    useEffect(() => {
        setDeliveryCharges(25 * subMultiply);
        let gst = 0.05;
        setTaxes(Math.round((total * subMultiply) * gst));
    }, [total])

    
    useEffect(() => {
        if (choosenPlan === '2-week'){
            setSubMultiply(2);
        } else {
            setSubMultiply(4);
        }
    }, [choosenPlan])



  const wait = timeout => {
      return new Promise(resolve => {
        setTimeout(resolve, timeout);
      });
  };



  const addAddress = async () => {
        const token = await SecureStore.getItemAsync('USER_TOKEN')
        if (token) {
            setIndicPos('absolute');
            fetch('http://192.168.0.156:8000/store/myaddress/',{
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ address: inputAddress, locality: inputLocality, city: inputCity, type_of_address: inputAddressType })
            })
            .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
            .then(resp => (setMyAddresses(resp.json.data), setDeliveryAddress(resp.json.delivery_address)))
            .then(() => (setMyAddressesStatus(200), setDeliveryAddressStatus(200)))
            .then(() => (setInputAddress(''), setInputLocality(''), setInputAddressType('')))
            .then(() => setAddressModal(false))
            .then(() => setIndicPos('relative'))
            .then(() => showMessage({
                message: 'Address saved !',
                position: 'top',
                floating: true,
                titleStyle: {fontFamily: 'Maven-sem', fontSize: wp(3.5)},
                style: {alignItems: 'center'},
                icon: 'auto',
                type: 'success',
                statusBarHeight: hp(3),
                duration: 4000
            }))
            .catch(error => setError(error))
        } else {
            navigation.navigate('Register')
        }
        
  }


  const deleteAddress = (item) => async evt => {
    const token = await SecureStore.getItemAsync('USER_TOKEN')
    if (token) {
        fetch('http://192.168.0.156:8000/store/myaddress/',{
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ address_id: item.id })
        })
        .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
        .then(resp => (setMyAddresses(resp.json.data),  setMyAddressesStatus(resp.status), setDeliveryAddressStatus(resp.json.deliveryaddstatus)))
        .catch(error => setError(error))
    } else {
        navigation.navigate('Register')
    }
  }


    const setDeliveryAdrress = (item) => async evt => {
        const token = await SecureStore.getItemAsync('USER_TOKEN')
        if (token) {
            fetch('http://192.168.0.156:8000/store/deliveryaddress/',{
                method: 'POST',
                headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/json'
                },
                body: JSON.stringify({ address_id: item.id })
            })
            .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
            .then(() => setDeliveryAddress([item]))
            .then(() => setDeliveryAddressStatus(200))
            .then(() => setAddressModal(false))
            .then(() => (setInputAddress(''), setInputLocality(''), setInputAddressType('')))
            .catch(error => setError(error))
        } else {
            navigation.navigate('Register')
        }
    }



    //Location

  const handleRegionChange = async (mapData) => {

    if(mounted){
      markerData.timing({latitude: mapData.latitude, longitude: mapData.longitude, duration: 1, useNativeDriver: false}).start();
      setMapDefLocation({latitude: mapData.latitude, longitude: mapData.longitude, latitudeDelta: mapData.latitudeDelta, longitudeDelta: mapData.longitudeDelta});
    }

    let geolocation = await Location.reverseGeocodeAsync({latitude: mapData.latitude, longitude: mapData.longitude})
    if (mounted) {
      setInputAddress(geolocation[0].name !== 'Unnamed Road' && !(geolocation[0].name.includes(geolocation[0].city)) && !(geolocation[0].name.includes('Road')) && !(geolocation[0].name.includes('Nagar')) && geolocation[0].name !== geolocation[0].district ? geolocation[0].name : '');
      setInputCity(geolocation[0].district ? geolocation[0].district + (geolocation[0].city === null ? '' : ', ' + geolocation[0].city)  : geolocation[0].postalCode ? geolocation[0].postalCode + (geolocation[0].city === null ? '' : ', ' + geolocation[0].city)  : (geolocation[0].city === null ? '' : geolocation[0].city))
    }

  }


  const getLocation = () => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      mapRef.current.animateToRegion({latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006}, 1500)
      
      let geolocation = await Location.reverseGeocodeAsync({latitude: location.coords.latitude, longitude: location.coords.longitude})
      if (mounted) {
        setInputAddress(geolocation[0].name !== 'Unnamed Road' && !(geolocation[0].name.includes(geolocation[0].city)) && !(geolocation[0].name.includes('Road')) && !(geolocation[0].name.includes('Nagar')) && geolocation[0].name !== geolocation[0].district ? geolocation[0].name : '');
        setInputCity(geolocation[0].district ? geolocation[0].district + (geolocation[0].city === null ? '' : ', ' + geolocation[0].city)  : geolocation[0].postalCode ? geolocation[0].postalCode + (geolocation[0].city === null ? '' : ', ' + geolocation[0].city)  : (geolocation[0].city === null ? '' : geolocation[0].city))
        markerData.timing({latitude: location.coords.latitude, longitude: location.coords.longitude, duration: 1, useNativeDriver: false}).start();
        setMapDefLocation({latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006}) 
      }

    })().catch(error => setError(error))
  }



//Handling payments and place order

const createPaymentOrder = async (payMethod) => {
    setOnPlace(true);
    const token = await SecureStore.getItemAsync('USER_TOKEN')
    if (token) {
      fetch('http://192.168.0.156:8000/store/createpaymentorder/',{
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({order_amount: appliedCoupon ? (total * subMultiply) + deliveryCharges + taxes - appliedCoupon.discount: (total * subMultiply) + deliveryCharges + taxes})
      })
      .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
      .then(resp => openRazorpayCheckout(resp.json.resp.id, payMethod))
      .catch(error => setError(error))
    } else {
        setOnPlace(false);
    }
  }


  const openRazorpayCheckout = async (order_id, payMethod) => {
    const token = await SecureStore.getItemAsync('USER_TOKEN')
    var options = {
      description: 'Payment for order',
      currency: 'INR',
      key: 'rzp_test_n9ilrJg1PZ5pJf',
      amount: appliedCoupon ? (total * subMultiply) + deliveryCharges + taxes - appliedCoupon.discount: (total * subMultiply) + deliveryCharges + taxes,
      name: 'FitStop',
      order_id: order_id,//Replace this with an order_id created using Orders API.
      prefill: {
        email: email !== '' ? email : 'abc@abc.com',
        contact: phone,
        name: name,
        method: payMethod
      },
      theme: {color: '#249c86', hide_topbar: true},
      retry: {
          enabled: true,
          max_count: 1
      },
      modal: {
          ondismiss: () => {
              setOnPlace(false);
              showMessage({
                message: 'Payment failed.',
                position: 'top',
                floating: true,
                titleStyle: {fontFamily: 'Maven-sem', fontSize: wp(3.5)},
                style: {alignItems: 'center'},
                icon: 'auto',
                type: 'danger',
                statusBarHeight: hp(3),
                duration: 5000
            })
          },
          confirm_close: true
      },
      remember_customer: true,
      method: {
        netbanking: true,
        upi: true,
        card: true,
        wallet: false,
      },
      timeout: 300
    }

    RazorpayCheckout.open(options).then((data) => {
      // handle success
        setAfterPaymentModal(true);
        if (token) {
            fetch('http://192.168.0.156:8000/store/subscribe/',{
                method: 'POST',
                headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/json'
                },
                body: JSON.stringify({pushToken: conPushToken === null ? null: conPushToken.data, total_price: appliedCoupon ? (total * subMultiply) + deliveryCharges + taxes - appliedCoupon.discount: (total * subMultiply) + deliveryCharges + taxes, 
                    cart_total: (total * subMultiply), coupon: appliedCoupon ? appliedCoupon.discount: 0, delivery_charges: deliveryCharges, taxes: taxes, 
                    payment: payMethod, payment_order_id: order_id, razorpay_payment_id: data.razorpay_payment_id, razorpay_signature: data.razorpay_signature, 
                    plan: choosenPlan, startdate: choosenDay.dateString, enddate: choosenPlan === '2-week' ? moment(choosenDay.dateString).add(13, 'days').format('YYYY-MM-DD') : moment(choosenDay.dateString).add(27, 'days').format('YYYY-MM-DD')})
            })
            .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
            .then(resp => {
                if (resp.status === 201) {
                    showMessage({
                        message: 'Order placed !',
                        position: 'top',
                        floating: true,
                        titleStyle: {fontFamily: 'Maven-sem', fontSize: wp(3.5)},
                        style: {alignItems: 'center'},
                        icon: 'auto',
                        type: 'success',
                        statusBarHeight: hp(3),
                        duration: 4000
                    })
                    navigation.pop();
                } else if (resp.status === 401) {
                    setOnPlace(false);
                    setAfterPaymentModal(false);
                    showMessage({
                        message: 'We could not verify the source of payment. If any amount is debited, it will be refunded at the earliest.',
                        position: 'top',
                        floating: true,
                        titleStyle: {fontFamily: 'Maven-sem', fontSize: wp(3.5)},
                        style: {alignItems: 'center'},
                        icon: 'auto',
                        type: 'danger',
                        statusBarHeight: hp(3),
                        duration: 5000
                    })
                }
            })
            .catch(error => (setError(error), setOnPlace(false), setAfterPaymentModal(false)))
        } else {
            navigation.navigate('Register')
        }
    }).catch((error) => {
      // handle failure
        showMessage({
            message: 'Payment failed. If any amount is debited, it will be refunded at the earliest.',
            position: 'top',
            floating: true,
            titleStyle: {fontFamily: 'Maven-sem', fontSize: wp(3.5)},
            style: {alignItems: 'center'},
            icon: 'auto',
            type: 'danger',
            statusBarHeight: hp(3),
            duration: 5000
        })
      setOnPlace(false);
      setAfterPaymentModal(false);
    });
  }



  const deleteCart = () => async evt=>  {
    const token = await SecureStore.getItemAsync('USER_TOKEN')
    if (token){
        fetch('http://192.168.0.156:8000/store/subscart/',{
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/json'
            }
        })
        .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
        .then(resp => {if (mounted && resp.status === 200) {setCartStatus(404)}})
        .catch(error => setError(error))
    }
  }

    const deleteItem = async (item) => {
        const token = await SecureStore.getItemAsync('USER_TOKEN')
        if (token)
            fetch('http://192.168.0.156:8000/store/subsreduceordelete/',{
                method: 'DELETE',
                headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/json'
                },
                body: JSON.stringify({ item: item })
            })
            .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
            .then(resp => {
                setCartList(resp.json.items);
                setTotal(resp.json.total);
                setItemPhotos(resp.json.photos);
                if (resp.json.items.length === 0){
                    setCartStatus(404);
                }
                if (appliedCoupon && resp.json.total < appliedCoupon.min_items_price) {
                    setAppliedCoupon(null);
                }
            })
            .then(() => {})
            .catch(error => setError(error))
    }



    const animationModalShow = () => {
        wait(400).then(() => setAnimationModal(true));
    }


    const retry = async () => {
        setShowInidc(true);
        const token = await SecureStore.getItemAsync('USER_TOKEN')
        try {
            if (token) {
                fetch('http://192.168.0.156:8000/store/subsconfirm/',{
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setCartList(resp.json.items), setTotal(resp.json.total), setCartStatus(resp.status), setItemPhotos(resp.json.photos), setTest(resp.json.custom_count)}})
                .catch(error => setError(error))

                fetch('http://192.168.0.156:8000/store/myaddress/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setMyAddresses(resp.json), setMyAddressesStatus(resp.status)}})
                .catch(error => setError(error))

                fetch('http://192.168.0.156:8000/store/getdeliveryaddress/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setDeliveryAddress(resp.json.address), setDeliveryAddressStatus(resp.status)}})
                .catch(error => setError(error))

                fetch('http://192.168.0.156:8000/store/coupons/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp =>  resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setCouponList(resp.json.data)}})
                .catch(error => setError(error))

                fetch('http://192.168.0.156:8000/api/me/',{
                    method: 'GET',
                    headers: {
                    'Authorization': `Token ${token}`,
                    'Content-type': 'application/json'
                    }
                })
                .then(resp => resp.json().then(data => ({status: resp.status, json: data})))
                .then(resp => {if (mounted) {setName(resp.json.name), setEmail(resp.json.email), setPhone(resp.json.phone)}})
                .then(() => setShowInidc(false))
                .then(() => setIsOffline(false))
                .catch(error => setError(error));
            } else {
                if (mounted) {
                    setCartStatus(401);
                    setShowInidc(false);
                    setIsOffline(false);
                }
            }
        } catch (error) {
            setError(error)
        } finally {
            NetInfo.fetch().then(state => {
                if (!state.isConnected) {
                  setTimeout(() => setShowInidc(false), 3000)
                }
            })
        }
    }


    if (isOffline) {
        return (
            <View style={{flex: 1, backgroundColor: '#fcfcfc'}}>
                <StatusBar style="inverted" />
                <Image source={require('../assets/offline.png')} style={{width: '95%', height: 1939*(screenWidth/3300), marginTop: wp(30), alignSelf: 'center'}} />
                <View style={{width: '80%', alignSelf: 'center'}}>
                <Text style={{fontFamily: 'Maven-bold', fontSize: wp(6), marginTop: 50, textAlign: 'center', color: 'black'}}>Uh oh! Seems like you are disconnected !</Text>
                {!showIndic ? <TouchableOpacity style={{alignSelf: 'center', marginTop: 25}} onPress={retry} activeOpacity={1}>
                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: '#249c86'}}>RETRY</Text>
                </TouchableOpacity>: <LottieView source={require('../assets/animations/connecting.json')} autoPlay={true} loop={true} style={{height: 100, alignSelf: 'center'}} />}
                </View>
            </View>
        )
    }




  if (cartStatus === 0) {
      return (
          <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
              <StatusBar style="inverted" />
              <LottieView source={require('../assets/animations/9258-bouncing-fruits.json')} style={{width: 200}} loop={true} autoPlay={true} />
          </View>
      )
  }

  
  if (cartStatus === 404){
      return (
          <View style={{flex: 1, backgroundColor: '#ffffff', justifyContent: 'center'}}>
              <StatusBar style="inverted" />
              <LottieView source={require('../assets/animations/empty-cart.json')} autoPlay={true} style={{width: 225, alignSelf: 'center'}} />
              <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', fontSize: wp(5), marginTop: 25}}>Your cart is empty!</Text>
              <TouchableOpacity style={{alignSelf: 'center', marginTop: 15}} onPress={() => navigation.goBack()} activeOpacity={1}>
                  <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: '#249c86'}}>ADD NOW</Text>
              </TouchableOpacity>
          </View>
      )
  }


  if (cartStatus === 401){
        return (
            <View style={[styles.container, {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}]}>
                <TouchableOpacity onPress={() => (navigation.goBack(), navigation.navigate('Register'))} activeOpacity={1}>
                    <Text style={{color: '#249c86', fontFamily: 'Maven-sem', fontSize: wp(5)}}>Login </Text>
                </TouchableOpacity> 
                <Text style={{fontFamily: 'Maven-med', fontSize: wp(5)}}>to continue!</Text>
            </View>
        )
    }

  return (
      <View style={styles.container}>
          <StatusBar style="inverted" />
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 50, paddingTop: 15}} overScrollMode={'never'}>
            
            <View>
                <ScrollView contentContainerStyle={cartList.length > 2 ? {paddingBottom: 25, paddingLeft: 30}: {flex: 1, justifyContent: 'center', paddingBottom: 25, paddingLeft: 30}} horizontal={true} showsHorizontalScrollIndicator={false}>
                {cartStatus === 200 ? cartList.map((item) => {
                    return (
                        <View style={{backgroundColor: 'white', flex: cartList.length > 1 ? 1 : 0, elevation: 5, shadowOffset: {width: 0, height: 2}, shadowRadius: 3.84, shadowOpacity: 0.25, shadowColor: '#000', marginBottom: 15, marginRight: 35, marginTop: 10, padding: 20, paddingBottom: 30, borderRadius: 10}} key={item.id}>
                            {itemPhotos.map((item1) => {
                                return item1.name === item.ordereditem ? 
                                <View key={item1.id}>
                                    <Image source={{uri: item1.image}} style={{width: 100, height: 80, alignSelf: 'center'}} />
                                </View>
                                : null
                            })}
                            <Text style={{fontFamily: 'Maven-sem', textAlign: 'center', marginTop: 5, fontSize: wp(4), color: 'black'}}>{item.ordereditem}</Text>
                            {test.map(w => {
                                return w.get_count.map(x => {
                                    return x.ordereditem === item.ordereditem ?
                                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}} key={x.weight}>
                                        <Text style={{fontFamily: 'Maven-med', textAlign: 'center', marginTop: 5, fontSize: wp(3.2), color: 'black'}}>{x.weight} (&#8377; {x.price})  x{x.cou}</Text>
                                    </View>: null
                                })
                            })}
                            <Text style={{fontFamily: 'Maven-sem', fontSize: wp(3.5), position: 'absolute', bottom: 5, alignSelf: 'center', marginTop: 10, color: 'black'}}> &#8377; {item.items_price['price__sum']} </Text>
                            <TouchableOpacity style={{position: 'absolute', top: 2, right: 2}} onPress={() => deleteItem(item)} activeOpacity={1}>
                                <Entypo name="circle-with-cross" size={15} color="#F67280" />
                            </TouchableOpacity>
                        </View>
                    )
                }): cartStatus === 404 ? <Text style={{textAlign: 'center', fontFamily: 'Maven-med', color: 'black'}}>Your cart is empty!</Text>: <Text>Please Login to build your cart!</Text>}
                </ScrollView>
                <TouchableOpacity style={{marginBottom: 25, alignSelf: 'center'}} disabled={cartStatus === 200 ? false: true} onPress={deleteCart()} activeOpacity={1}>
                    <Text style={{fontFamily: 'Maven-sem', color: "#F67280", fontSize: wp(4)}}>Clear all</Text>
                </TouchableOpacity>
            </View>
            <View style={{flex: 1, marginTop: 20, width: '85%', alignSelf: 'center'}}>
                <View style={{marginBottom: 25}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <CustomIcon name="subscription" size={20} color="black" />
                        <Text style={{fontFamily: 'Maven-bold', fontSize: wp(4.5), color: 'black', marginLeft: 5}}>Your plan</Text>
                    </View>
                    <Text style={{fontFamily: 'Maven-med', fontSize: wp(3.5), marginTop: 5, marginLeft: 25}}>{choosenPlan} plan. Starting from {choosenDay.dateString} and ends on {choosenPlan === '2-week' ? moment(choosenDay.dateString).add(13, 'days').format('YYYY-MM-DD') : moment(choosenDay.dateString).add(27, 'days').format('YYYY-MM-DD')}</Text>
                    <TouchableOpacity style={{marginTop: 5, alignSelf: 'flex-start', marginLeft: 25}} onPress={() => setShowModal(true)} activeOpacity={1}>
                        <Text style={{fontFamily: 'Maven-sem', color: '#249c86', fontSize: wp(3.5)}}>Change plan</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={{backgroundColor: '#ebebeb', alignSelf: 'center', width: '100%', height: 1, marginBottom: 25}}></Text>
                {deliveryAddressStatus === 200 ? deliveryAddress.map((item) => {
                    return (
                        <View key={item.id}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <CustomIcon name="location" size={20} color="black" />
                                <Text style={{fontFamily: 'Maven-bold', fontSize: wp(4.5), marginLeft: 5, color: 'black'}}>Products will be delivered at:</Text>
                            </View>
                            <Text style={{flex: 1, fontFamily: 'Maven-med', fontSize: wp(3.5), marginTop: 5, marginLeft: 25, color: 'black'}}>{item.address}, {item.locality}, {item.city}</Text>
                            <TouchableOpacity style={{marginTop: 5, alignSelf: 'flex-start', marginLeft: 25}} onPress={() => setAddressModal(true)} activeOpacity={1}>
                                <Text style={{fontFamily: 'Maven-sem', color: '#249c86', fontSize: wp(3.5)}}>Change delivery address</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }):
                <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <CustomIcon name="location" size={20} color="black" />
                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(4), color: 'red', marginLeft: 5}}>You haven't set your delivery address yet!</Text>
                    </View>
                    <TouchableOpacity style={{marginTop: 5, alignSelf: 'flex-start', marginLeft: 25}} onPress={() => setAddressModal(true)} activeOpacity={1}>
                        <Text style={{fontFamily: 'Maven-sem', color: '#249c86', fontSize: wp(3.5)}}>Add delivery address</Text>
                    </TouchableOpacity>
                </View>}
                <View style={{marginTop: 40, backgroundColor: '#fff', padding: 10, paddingBottom: 20, borderRadius: 10, elevation: 2, shadowOffset: {width: 0, height: 1}, shadowRadius: 1.41, shadowOpacity: 0.20, shadowColor: '#000'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{flex: 1}}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <LottieView source={require('../assets/animations/48974-offer-animation.json')} autoPlay={true} loop={true} style={{width: 30, height: 30}} />
                                <Text style={{fontFamily: 'Maven-bold', fontSize: wp(4.5), color: 'black'}}>Offers</Text>
                            </View>
                            {appliedCoupon ? <Text style={{fontFamily: 'Maven-med', flex: 1, fontSize: wp(3.5), marginLeft: 25, color: 'black'}}>&#8377; {appliedCoupon.discount} off applied on your order!</Text> : <Text style={{fontFamily: 'Maven-med', flex: 1, marginLeft: 25, fontSize: wp(3.5), color: 'black'}}>No offer applied!</Text>}
                        </View>
                        {appliedCoupon ? 
                            <TouchableOpacity style={{flex: 0.2, justifyContent: 'center', marginTop: 5}} onPress={() => setAppliedCoupon(null)} activeOpacity={1}>
                                <FontAwesome name="remove" size={wp(3.5)} color="#249c86" />
                            </TouchableOpacity>:
                            <TouchableOpacity style={{flex: 0.5, marginTop: 5}} onPress={() => setCouponModal(true)} activeOpacity={1}>
                                <Text style={{fontFamily: 'Maven-sem', color: '#249C86', fontSize: wp(3.5)}}>View offers</Text>
                            </TouchableOpacity>
                        }
                    </View>
                </View>
                <Text style={{backgroundColor: '#ebebeb', alignSelf: 'center', width: '100%', height: 1, marginTop: 50}}></Text>
                <View style={{marginTop: 40, borderRadius: 10, marginBottom: 50}}>
                    <Text style={{fontFamily: 'Maven-bold', fontSize: wp(5), color: 'black', marginBottom: 25}}>Bill details</Text>
                    <View style={{flexDirection: 'row', marginBottom: 1, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>Item subtotal</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>&#8377; {(total * subMultiply)}</Text>
                    </View>
                    <View style={{flexDirection: 'row', marginBottom: 1, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>Item subtotal</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>&#8377; {total}</Text>
                    </View>
                    <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>For {choosenPlan === '2-week' ? '2 deliveries (2-week plan)': '4 deliveries (month plan)'}</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>&#8377; {(total * subMultiply)}</Text>
                    </View>
                    <Text style={{backgroundColor: 'white', height: 1, marginBottom: 10}}></Text>
                    <View style={{flexDirection: 'row', marginBottom: 1, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>Delivery Charges</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>&#8377; {deliveryCharges}</Text>
                    </View>
                    <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>For {choosenPlan === '2-week' ? '2 deliveries (2-week plan)': '4 deliveries (month plan)'}</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(3.5), color: 'grey'}}>&#8377; 25 x {subMultiply}</Text>
                    </View>
                    <Text style={{backgroundColor: 'white', height: 1, marginBottom: 10}}></Text>
                    <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>Taxes</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>&#8377; {taxes}</Text>
                    </View>
                    <Text style={{backgroundColor: 'white', height: 1, marginBottom: 10}}></Text>
                    {appliedCoupon ? 
                        <View>
                            <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
                                <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(4), color: '#249c86'}}>Coupon Applied</Text>
                                <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4), color: '#249c86'}}>- &#8377; {appliedCoupon.discount}</Text>
                            </View>
                            <Text style={{backgroundColor: 'white', height: 2, marginBottom: 10}}></Text>
                        </View>: null
                    }
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={{flex: 1, fontFamily: 'Maven-sem', fontSize: wp(4.5), color: 'black'}}>Grand Total</Text>
                        {appliedCoupon ? <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4.5), color: 'black'}}>&#8377; {(total * subMultiply) + deliveryCharges + taxes - appliedCoupon.discount}</Text>: <Text style={{flex: 1, textAlign: 'right', fontFamily: 'Maven-sem', fontSize: wp(4.5), color: 'black'}}>&#8377; {(total * subMultiply) + deliveryCharges + taxes}</Text>}
                    </View>
                </View>

                <Modal
                    isVisible={addressModal}
                    backdropColor={'white'}
                    backdropOpacity={1}
                    animationIn={'slideInLeft'}
                    animationOut={'slideOutRight'}
                    backdropTransitionInTiming={600}
                    backdropTransitionOutTiming={600}
                    animationInTiming={600}
                    animationOutTiming={600}
                    useNativeDriver={true}
                    style={{margin: 0}}
                    onBackButtonPress={() => (setAddressModal(false), setInputAddress(''), setInputLocality(''), setInputAddressType(''))}
                >
                    <View style={{marginBottom: hp(40)}}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={mapDefLocation}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                            onRegionChangeComplete={handleRegionChange}
                            customMapStyle={mapStyle}
                            onRegionChange={(mapData) => markerData.timing({latitude: mapData.latitude, longitude: mapData.longitude, duration: 0, useNativeDriver: false}).start()}
                        >
                            <MarkerAnimated
                                coordinate={markerData}
                            />
                        </MapView>
                        
                        <TouchableOpacity style={{position: 'absolute', top: 5, left: 15}} onPress={() => (setAddressModal(false), setInputAddress(''), setInputLocality(''), setInputAddressType(''))} activeOpacity={1}>
                            <Text style={{fontSize: wp(7), fontWeight:'bold', color: 'black'}}>&#x27F5;</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{position: 'absolute', top: 15, right: 15, backgroundColor: '#f0f0f0', padding: wp(2), elevation: 25, shadowOffset: {width: 0, height: 12}, shadowRadius: 16, shadowOpacity: 0.58, shadowColor: '#000'}} onPress={getLocation} activeOpacity={1}>
                        {Platform.OS === 'android' ? <MaterialIcons name="my-location" size={wp(8)} color="black" />: <Ionicons name="ios-location" size={wp(6.5)} color="black" />}
                        </TouchableOpacity>
                    </View>
                    <View style={{backgroundColor: '#fcfcfc', elevation: 25, shadowOffset: {width: 0, height: 12}, shadowRadius: 16, shadowOpacity: 0.58, shadowColor: '#000', borderTopLeftRadius: 50, borderTopRightRadius: 50, flex: 1, paddingTop: 5}}>
                        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 35, paddingBottom: 50}} >
                            <View>
                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(5), marginBottom: 25, color: 'black'}}>Choose delivery address</Text>
                                {myAddressesStatus === 200 ? myAddresses.map((item, index) => {
                                    return (
                                        <View key={item.id}>
                                            <TouchableOpacity onPress={setDeliveryAdrress(item)} activeOpacity={1}>
                                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                    {item.type_of_address === 'Home' ?  <MaterialIcons name="home" size={wp(4)} color="#249c86" />: <MaterialIcons name="work" size={wp(3)} color="#249c86" />}
                                                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: '#249c86'}}> {item.type_of_address}</Text>
                                                </View>
                                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
                                                    <Text style={{fontFamily: 'Maven-med', flex: 1, fontSize: wp(3.5), color: 'black'}}>{item.address}, {item.locality}, {item.city}</Text>
                                                    <TouchableOpacity onPress={deleteAddress(item)} activeOpacity={1}>
                                                        <Text style={{fontFamily: 'Maven-med', color: 'red'}}>Remove</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </TouchableOpacity>
                                            {myAddresses && index !== (myAddresses.length - 1) ?<Text style={{borderBottomWidth: 1, marginBottom: 20, borderBottomColor: '#f0f0f0'}}></Text> : null}
                                        </View>
                                    )
                                }):<Text style={{fontFamily: 'Maven-med', color: 'black'}}>You don't have any saved addresses. Add one now!</Text>}
                            </View>
                            <Text style={{borderBottomWidth: 1, borderBottomColor: '#ebebeb', marginTop: 25}}></Text>
                            <View style={{marginTop: 25}} >
                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(5), color: 'black'}}>Add an address</Text>
                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(3), marginBottom: 25, color: 'black'}}>(Use the map to auto-fill)</Text>
                                <ActivityIndicator size={50} color="#6aab9e" style={{position: indicPos, display: 'none', alignSelf: 'center', top: 0, bottom: 0}} />
                                <TextInput style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 10, fontFamily: 'Maven-med' }} placeholder={'House/Colony'} value={inputAddress} onChangeText={(text) => setInputAddress(text)} />
                                <TextInput style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 10, fontFamily: 'Maven-med' }} placeholder={'Road Number, Road Name'} value={inputLocality} onChangeText={(text) => setInputLocality(text)} />
                                <TextInput style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 10, fontFamily: 'Maven-med' }} placeholder={'City'} value={inputCity} onChangeText={(text) => setInputCity(text)} />
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <TouchableOpacity style={{backgroundColor: inputAddressType === 'Home' ? '#249c86' :'white', padding: 10, borderRadius: 5, borderWidth: 0.3, borderColor: inputAddressType === 'Home' ? '#249c86': 'black'}} onPress={() => setInputAddressType('Home')} activeOpacity={1}>
                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(3), textAlign: 'center', color: inputAddressType === 'Home' ? 'white': 'black'}}>Home</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{marginLeft: 25, backgroundColor: inputAddressType === 'Work' ? '#249c86' :'white', padding: 10, borderRadius: 5, borderWidth: 0.3, borderColor: inputAddressType === 'Work' ? '#249c86': 'black'}} onPress={() => setInputAddressType('Work')} activeOpacity={1}>
                                    <Text style={{fontFamily: 'Maven-med', fontSize: wp(3), textAlign: 'center', color: inputAddressType === 'Work' ? 'white': 'black'}}>Work</Text>
                                    </TouchableOpacity>
                                </View>
                                {inputAddress === '' || inputLocality === '' || inputCity === '' || inputAddressType === '' ? 
                                    <TouchableOpacity style={{marginTop: 25, opacity: 0.2, backgroundColor: '#6aab9e', padding: 10, borderRadius: 10}} disabled={true}>
                                        <Text style={{fontFamily: 'Maven-sem', fontSize: wp(3), textAlign: 'center', color: 'black'}}>Save address</Text>
                                    </TouchableOpacity>:
                                    <Ripple style={{marginTop: 25, opacity: 1, backgroundColor: '#6aab9e', padding: 10, borderRadius: 10, elevation: 5, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, shadowColor: '#000'}} disabled={false} onPress={addAddress} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                        <Text style={{fontFamily: 'Maven-sem', fontSize: wp(3), textAlign: 'center', color: 'black'}}>Save address</Text>
                                    </Ripple>
                                }
                            </View>
                        </ScrollView>    
                    </View>     
                </Modal>

                <Modal 
                    isVisible={paymentModal}
                    backdropColor={'white'}
                    backdropOpacity={0.7} 
                    backdropTransitionInTiming={600}
                    backdropTransitionOutTiming={600}
                    animationInTiming={600}
                    animationOutTiming={600}
                    useNativeDriver={true}
                    useNativeDriverForBackdrop={true}
                    onBackButtonPress={() => setPaymentModal(false)}
                    onBackdropPress={() => setPaymentModal(false)}
                    style={{margin: 0}}
                >
                    <View style={{flex: 1, backgroundColor: 'white', height: '35%', position: 'absolute', bottom: 0, width: '100%', elevation: 25, shadowOffset: {width: 0, height: 12}, shadowRadius: 16, shadowOpacity: 0.58, shadowColor: '#000', paddingBottom: 5}}>
                        <Text style={{paddingLeft: 25, paddingTop: 25, fontFamily: 'Maven-bold', fontSize: wp(6), marginBottom: 5, color: 'black'}}>Choose payment method</Text>
                        <ScrollView
                         overScrollMode={'never'} 
                         showsHorizontalScrollIndicator={false}
                         horizontal={true}
                         contentContainerStyle={{ paddingBottom: 25}}
                        >
                            <View style={{paddingLeft: 25, flexDirection: 'row', alignItems: 'center', paddingRight: 25}}>
                                <Ripple style={{marginRight: 25, padding: 25, paddingLeft: 35, paddingRight: 35, borderRadius: 10, backgroundColor: '#fcfcfc', elevation: 5, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, shadowColor: '#000'}} onPress={() => (setPaymentModal(false), createPaymentOrder('card'))} activeOpacity={1} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                    <CustomIcon name="card" size={20} color="black" style={{alignSelf: 'center'}}  />
                                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black', marginTop: 10, textAlign: 'center'}}>Card</Text>
                                </Ripple>
                                <Ripple style={{marginRight: 25, padding: 25, paddingLeft: 35, paddingRight: 35, borderRadius: 10, backgroundColor: '#fcfcfc', elevation: 5, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, shadowColor: '#000'}} onPress={() => (setPaymentModal(false), createPaymentOrder('upi'))} activeOpacity={1} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                    <CustomIcon name="upi" size={20} color="black" style={{alignSelf: 'center'}}  />
                                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black', marginTop: 10, textAlign: 'center'}}>UPI</Text>
                                </Ripple>
                                <Ripple style={{marginRight: 25, padding: 25, paddingLeft: 35, paddingRight: 35, borderRadius: 10, backgroundColor: '#fcfcfc', elevation: 5, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, shadowColor: '#000'}} onPress={() => (setPaymentModal(false), createPaymentOrder('netbanking'))} activeOpacity={1} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                    <CustomIcon name="netbanking" size={20} color="black" style={{alignSelf: 'center'}}  />
                                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black', marginTop: 10, textAlign: 'center'}}>Net banking</Text>
                                </Ripple>
                                {/* <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginTop: 25, alignSelf: 'flex-start'}} onPress={() => (setPaymentModal(false), placeOrder())} activeOpacity={1}>
                                    <MaterialCommunityIcons name="cash" size={20} color="black"/>
                                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black', marginLeft: 10}}>Cash On Delivery</Text>
                                </TouchableOpacity>
                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(3)}}>(Note: If selected Cash On Delivery you won't be able to choose another method as order will be placed. We recommend paying online to ensure safety in these tough times !)</Text> */}
                            </View>
                        </ScrollView>
                    </View>
                    
                </Modal>


                <Modal
                    isVisible={couponModal}
                    backdropOpacity={0.3}
                    backdropColor={'white'}
                    animationIn={'zoomIn'}
                    animationOut={'zoomOut'}
                    onBackButtonPress={() => setCouponModal(false)}
                    onBackdropPress={() => setCouponModal(false)}
                    useNativeDriver={true}
                >
                    <View style={{backgroundColor: 'white', padding: 20, maxHeight: '30%', borderRadius: 10, elevation: 25, shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.58, shadowRadius: 16.00, shadowColor: '#000'}}>
                        {couponList.length > 0 ? <Text style={{fontFamily: 'Maven-sem', marginBottom: 25, fontSize: wp(5), textAlign: 'center', color: 'black'}}>Available Offers</Text>: <LottieView source={require('../assets/animations/823-crying.json')} autoPlay={true} loop={true} style={{width: 80, height: 80, alignSelf: 'center'}} />}
                        <FlatList 
                            data={couponList}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (!couponList.length ? <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', color: 'black'}}>No offers available right now!</Text>: null)}
                            renderItem={({ item }) => (
                                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 0.7, borderStyle: 'dashed', borderRadius: 1, padding: 10}}>
                                    <View style={{flex: 1}}>
                                        <Text style={{fontFamily: 'Maven-med', color: 'black'}}>{item.name}</Text>
                                        <Text style={{fontFamily: 'Maven-sem', textDecorationLine: 'underline', color: 'black'}}>{item.description}</Text>
                                    </View>
                                    <TouchableOpacity disabled={total > item.min_items_price ? false : true} onPress={() => (setAppliedCoupon(item), setCouponModal(false), animationModalShow())} activeOpacity={1}>
                                        <Text style={total > item.min_items_price ? {opacity: 1, fontFamily: 'Maven-sem', color: '#249c86'}: {opacity: 0.2, fontFamily: 'Maven-sem', color: '#249c86'}}>Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </Modal>

                <Modal isVisible={animationModal} backdropOpacity={0}>
                    <LottieView source={require('../assets/animations/55150-confetti.json')} autoPlay={true} loop={false} onAnimationFinish={() => setAnimationModal(false)} />
                </Modal>

                <Modal
                    isVisible={onPlaceLottieModal}
                    backdropColor={'white'}
                    backdropOpacity={1}
                >
                    <LottieView style={{alignSelf: 'center', width: 300}} source={require('../assets/animations/order-placed.json')} autoPlay={true} loop={false} onAnimationFinish={() => navigation.pop()} />
                    <Text style={{fontFamily: 'Maven-sem', fontSize: wp(7), marginTop: 50, textAlign: 'center', color: 'black'}}>Order Placed !</Text>
                </Modal>

                <Modal
                    isVisible={afterPaymentModal}
                    backdropColor={'white'}
                    backdropOpacity={0.2}
                >
                    <ActivityIndicator color="#249c86" size={50} />
                </Modal>

                <Modal
                        isVisible={showModal}
                        onBackdropPress={() => setShowModal(false)}
                        onBackButtonPress={() => setShowModal(false)}
                        backdropOpacity={0.8}
                        backdropColor={'white'}
                        style={{margin: 0}}
                        useNativeDriver={true}
                        useNativeDriverForBackdrop={true}
                        animationInTiming={300}
                        animationOutTiming={300}
                        backdropTransitionInTiming={300}
                        backdropTransitionOutTiming={300}
                        animationIn={'slideInUp'}
                    >
                        <View style={{backgroundColor: 'white', marginTop: hp(10), height: '100%', flex: 1, elevation: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25}}>
                            <TouchableOpacity style={{alignSelf: 'flex-end', padding: 25, paddingBottom: 0}} onPress={() => setShowModal(false)} activeOpacity={1}>
                                <Text style={{color: '#249c86', fontSize: wp(4), fontFamily: 'Maven-sem', marginBottom: 25}}><Entypo name="circle-with-cross" size={15} color="#F67280" /></Text>
                            </TouchableOpacity>
                            <Carousel 
                                ref={carouselRef}
                                data={carouselData}
                                sliderWidth={screenWidth}
                                itemWidth={screenWidth}
                                inactiveSlideScale={1}
                                scrollEnabled={false}
                                containerCustomStyle={{alignSelf: 'center'}}
                                renderItem={({item, index}) => {
                                    return (
                                        <View style={{flex: 1, padding: 25, paddingTop: 0}}>
                                            {index === 0 ?
                                            <View style={{flex: 1}}>
                                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(5.5)}}>Choose your plan</Text>
                                                <Text style={{fontFamily: 'Maven-med', fontSize: wp(4), color: 'black', marginTop: 10}}>{subType === 'Products' ? 'Items will be delivered on the first day of every plan week' : 'Items will be delivered daily'}</Text>
                                                <TouchableOpacity style={{flex: 0.5, borderWidth: 1.5, borderRadius: 5, borderColor: choosenPlan === '2-week' ? '#249c86' : 'grey', marginTop: 25, padding: 25, justifyContent: 'center'}} activeOpacity={1} onPress={() => setChoosenPlan('2-week')}>
                                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                        {choosenPlan === '2-week' ? 
                                                            <MaterialCommunityIcons name="checkbox-marked-circle" size={24} color="#249c86" />
                                                        :
                                                            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="grey" />
                                                        }
                                                        <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4.5), marginLeft: 15}}>2-week plan</Text>
                                                    </View>
                                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                        <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="white" />
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(3.5), color: 'grey', marginLeft: 15}}>2 total delieveries</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={{flex: 0.5, borderWidth: 1.5, borderRadius: 5, borderColor: choosenPlan === 'Monthly' ? '#249c86' : 'grey', marginTop: 25, padding: 25, justifyContent: 'center'}} activeOpacity={1} onPress={() => setChoosenPlan('Monthly')}>
                                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                        {choosenPlan === 'Monthly' ? 
                                                            <MaterialCommunityIcons name="checkbox-marked-circle" size={24} color="#249c86" />
                                                        :
                                                            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="grey" />
                                                        }
                                                        <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4.5), marginLeft: 15}}>Monthly plan</Text>
                                                    </View>
                                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                        <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="white" />
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(3.5), color: 'grey', marginLeft: 15}}>4 total deliveries</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={{flex: 1, marginTop: 50}}>
                                                    <Ripple style={{width: '50%', alignSelf: 'center', padding: 15, backgroundColor: '#6aab9e', borderRadius: 10, elevation: 5, shadowColor: "#000",shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, opacity: choosenPlan ? 1 : 0.2}} disabled={choosenPlan ? false : true} onPress={() => carouselRef.current.snapToNext()} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                                        <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), textAlign: 'center'}}>Next</Text>
                                                    </Ripple>
                                                </View>
                                            </View> :
                                            <View style={{flex: 1}}>
                                                <Text style={{fontFamily: 'Maven-sem', fontSize: wp(5.5), paddingBottom: 25}}>
                                                    Choose the day to start your plan
                                                </Text>
                                                <ScrollView contentContainerStyle={{padding: 5, paddingTop: 0, paddingBottom: 15}} showsVerticalScrollIndicator={false} overScrollMode={'never'}>
                                                    {choosenPlan === '2-week' ? 
                                                    <Calendar
                                                        style={{elevation: 5, marginTop: 5, borderRadius: 10, padding: 15, shadowColor: "#000", shadowOffset: {width: 0,height: 2,}, shadowOpacity: 0.25, shadowRadius: 3.84}}
                                                        onDayPress={(result) => setChoosenDay(result)}
                                                        minDate={currentDate}
                                                        disableAllTouchEventsForDisabledDays={true}
                                                        displayLoadingIndicator={true}
                                                        markingType={'period'}
                                                        markedDates={choosenDay ? {
                                                            [choosenDay.dateString]: {startingDay: true, color: '#6aab9e', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(1, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(2, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(3, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(4, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(5, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(6, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(7, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(8, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(9, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(10, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(11, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(12, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(13, 'days').format('YYYY-MM-DD')]: {endingDay: true, color: '#6aab9e', textColor: 'black'},
                                                        }
                                                        :
                                                        {}}
                                                        theme={{
                                                            arrowColor: '#249c86',
                                                            textMonthFontFamily: 'Maven-sem',
                                                            textDayFontFamily: 'Maven-med',
                                                            textDayHeaderFontFamily: 'Maven-sem',
                                                            indicatorColor: '#249c86',
                                                        }}
                                                    />:
                                                    <Calendar
                                                        style={{elevation: 5, marginTop: 5, borderRadius: 10, padding: 15, shadowColor: "#000", shadowOffset: {width: 0,height: 2,}, shadowOpacity: 0.25, shadowRadius: 3.84}}
                                                        onDayPress={(result) => setChoosenDay(result)}
                                                        minDate={currentDate}
                                                        disableAllTouchEventsForDisabledDays={true}
                                                        displayLoadingIndicator={true}
                                                        markingType={'period'}
                                                        markedDates={choosenDay ? {
                                                            [choosenDay.dateString]: {startingDay: true, color: '#6aab9e', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(1, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(2, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(3, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(4, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(5, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(6, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(7, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(8, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(9, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(10, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(11, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(12, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(13, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(14, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(15, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(16, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(17, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(18, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(19, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(20, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(21, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black', dotColor: 'black', marked: true},
                                                            [moment(choosenDay.dateString).add(22, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(23, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(24, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(25, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(26, 'days').format('YYYY-MM-DD')]: {color: '#e1f0ed', textColor: 'black'},
                                                            [moment(choosenDay.dateString).add(27, 'days').format('YYYY-MM-DD')]: {endingDay: true, color: '#6aab9e', textColor: 'black'},
                                                        }
                                                        :
                                                        {}}
                                                        theme={{
                                                            arrowColor: '#249c86',
                                                            textMonthFontFamily: 'Maven-sem',
                                                            textDayFontFamily: 'Maven-med',
                                                            textDayHeaderFontFamily: 'Maven-sem',
                                                            indicatorColor: '#249c86',
                                                        }}
                                                    />}
                                                    {choosenDay ? 
                                                    choosenPlan === '2-week' ?
                                                    <View style={{marginTop: 50}}> 
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(4)}}>&#9679;  Products will be delivered on the start of every plan week i.e., on <Text style={{fontFamily: 'Maven-sem'}}>{choosenDay.dateString} and {moment(choosenDay.dateString).add(7, 'days').format('YYYY-MM-DD')}</Text></Text>
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(4), marginTop: 25}}>&#9679;  Your subscription will end on <Text style={{fontFamily: 'Maven-sem'}}>{moment(choosenDay.dateString).add(13, 'days').format('YYYY-MM-DD')}</Text></Text>
                                                        <Ripple style={{backgroundColor: '#6aab9e', padding: 15, borderRadius: 10, width: '50%', alignSelf: 'center', marginTop: 25,  elevation: 5, shadowColor: "#000",shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84}} onPress={() => setShowModal(false)} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                                            <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), textAlign: 'center'}}>Confirm</Text>
                                                        </Ripple>
                                                    </View>
                                                    : 
                                                    <View style={{marginTop: 50}}> 
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(4)}}>&#9679;  Products will be delivered on the start of every plan week i.e., on <Text style={{fontFamily: 'Maven-sem'}}>{choosenDay.dateString}, {moment(choosenDay.dateString).add(7, 'days').format('YYYY-MM-DD')}, {moment(choosenDay.dateString).add(14, 'days').format('YYYY-MM-DD')} and {moment(choosenDay.dateString).add(21, 'days').format('YYYY-MM-DD')}</Text></Text>
                                                        <Text style={{fontFamily: 'Maven-med', fontSize: wp(4), marginTop: 25}}>&#9679;  Your subscription will end on <Text style={{fontFamily: 'Maven-sem'}}>{moment(choosenDay.dateString).add(27, 'days').format('YYYY-MM-DD')}</Text></Text>
                                                        <Ripple style={{backgroundColor: '#6aab9e', padding: 15, borderRadius: 10, width: '50%', alignSelf: 'center', marginTop: 25,  elevation: 5, shadowColor: "#000",shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84}} onPress={() => setShowModal(false)} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                                                            <Text style={{fontFamily: 'Maven-sem', fontSize: wp(4), textAlign: 'center'}}>Confirm</Text>
                                                        </Ripple>
                                                    </View>
                                                    : null}
                                                </ScrollView>
                                            </View>
                                            }
                                        </View>
                                    ) 
                                    
                                }} 
                            />
                            
                        </View>
                    </Modal>
            </View>
        </ScrollView>
        <View style={{position: 'absolute', backgroundColor: '#fcfcfc', padding: 15, bottom: 0, width: '100%', flexDirection: 'row', alignItems: 'center', elevation: 20, shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.51, shadowRadius: 13.16}}>
            <View style={{flex: 1}}>
                {appliedCoupon ? <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', fontSize: wp(4.5), color: 'black'}}>Total   &#8377; {(total * subMultiply) + deliveryCharges + taxes - appliedCoupon.discount}</Text>: <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', fontSize: wp(4.5), color: 'black'}}>Total   &#8377; {(total * subMultiply) + deliveryCharges + taxes}</Text>}
            </View>
            {onPlace ? <ActivityIndicator color="#6aab9e" size={50} style={{flex: 1}} />
                : myAddressesStatus === 200 && deliveryAddressStatus === 200 && cartStatus === 200 ? 
                <Ripple onPress={() => setPaymentModal(true)} style={{flex: 1, opacity: 1, backgroundColor: '#6aab9e', borderRadius: 5, padding: 15, alignSelf: 'center', width: '60%', elevation: 5, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 3.84, shadowColor: '#000'}} rippleDuration={600} rippleContainerBorderRadius={10} rippleOpacity={0.5} onLongPress={{}}>
                    <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', fontSize: wp(4), color: 'black'}}>Pay Now &raquo;</Text>
                </Ripple>:
                <TouchableOpacity disabled={true} style={{flex: 1, opacity: 0.1, backgroundColor: '#6aab9e', borderRadius: 5, padding: 15, alignSelf: 'center', width: '60%'}}>
                    <Text style={{textAlign: 'center', fontFamily: 'Maven-sem', color: 'black'}}>Pay Now &raquo;</Text>
                </TouchableOpacity>
            }
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{fontFamily: 'Maven-sem', position: 'absolute', top: 0, left: 50, fontSize: wp(2.5)}}>Payment type</Text>
            <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}} onPress={() => setPaymentModal(true)}>
                {paymentType === 'Cash On Delivery' ? <MaterialCommunityIcons name="cash" size={20} color="green"/> : paymentType === 'Card' ? <Entypo name="credit-card" size={20} color="black" />: <FontAwesome name="google-wallet" size={20} color="blue" />}
                <Text style={{textAlign: 'center', fontFamily: 'Maven-sem'}}> {paymentType}</Text>
            </TouchableOpacity>
            
        </View> */}
        
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingTop: 10
      
  },
  refreshcontainer: {
        flex: 1,
        backgroundColor: 'white'
  },
  refreshscrollview: {
        flex: 1,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: hp(50),
    top: 0,
    marginBottom: 1,
    position: 'absolute'
  },
});


var mapStyle = 
[
  {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
          {
              "saturation": "-100"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels.text.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "labels.text",
      "stylers": [
          {
              "color": "black"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "saturation": "-87"
          },
          {
              "lightness": "-40"
          },
          {
              "color": "#ffffff"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#f0f0f0"
          },
          {
              "saturation": "-22"
          },
          {
              "lightness": "-16"
          }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.local",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "saturation": "-52"
          },
          {
              "hue": "#30e3ca"
          },
          {
              "lightness": "-16"
          }
      ]
  }
]