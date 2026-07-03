import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { getFirebaseServices, OperationType, handleFirestoreError } from './firebase';
import { Product, StockItem, Channel, AutoDiscount, Order } from './types';

// Helper to upload all application data to Firestore
export async function uploadAllToFirestore(data: {
  products: Product[];
  stocks: StockItem[];
  channels: Channel[];
  autoDiscounts: AutoDiscount[];
  orders: Order[];
  brandName: string;
  brandLogo: string;
  brandProfile: string;
  brandFooter: string;
  appFont: string;
  appFontWeight: string;
  paymentMethods: string[];
  pencatatList: string[];
}) {
  const { db, auth } = getFirebaseServices();
  if (!db) throw new Error('Firebase Firestore is not initialized.');

  try {
    const batch = writeBatch(db);

    // 1. Upload products
    data.products.forEach(p => {
      const ref = doc(db, 'products', p.id);
      batch.set(ref, p);
    });

    // 2. Upload stocks
    data.stocks.forEach(s => {
      const ref = doc(db, 'stocks', s.id);
      batch.set(ref, s);
    });

    // 3. Upload channels
    data.channels.forEach(c => {
      const ref = doc(db, 'channels', c.id);
      batch.set(ref, c);
    });

    // 4. Upload autoDiscounts
    data.autoDiscounts.forEach(ad => {
      const ref = doc(db, 'autoDiscounts', ad.id);
      batch.set(ref, ad);
    });

    // 5. Upload orders
    data.orders.forEach(o => {
      const ref = doc(db, 'orders', o.id);
      batch.set(ref, o);
    });

    // 6. Upload settings
    const settingsRef = doc(db, 'settings', 'app');
    batch.set(settingsRef, {
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      brandProfile: data.brandProfile,
      brandFooter: data.brandFooter,
      appFont: data.appFont,
      appFontWeight: data.appFontWeight,
      paymentMethods: data.paymentMethods,
      pencatatList: data.pencatatList,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_upload', auth);
  }
}

// Helper to check if Firestore contains any data
export async function isFirestoreEmpty(): Promise<boolean> {
  const { db, auth } = getFirebaseServices();
  if (!db) return true;

  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.empty;
  } catch (error) {
    console.warn('Failed to check if firestore is empty, assuming yes', error);
    return true;
  }
}

// Helper to download all application data from Firestore
export async function downloadAllFromFirestore() {
  const { db, auth } = getFirebaseServices();
  if (!db) throw new Error('Firebase Firestore is not initialized.');

  try {
    // Fetch settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    // Fetch collections
    const productsSnap = await getDocs(collection(db, 'products'));
    const stocksSnap = await getDocs(collection(db, 'stocks'));
    const channelsSnap = await getDocs(collection(db, 'channels'));
    const autoDiscountsSnap = await getDocs(collection(db, 'autoDiscounts'));
    const ordersSnap = await getDocs(collection(db, 'orders'));

    const products = productsSnap.docs.map(d => d.data() as Product);
    const stocks = stocksSnap.docs.map(d => d.data() as StockItem);
    const channels = channelsSnap.docs.map(d => d.data() as Channel);
    const autoDiscounts = autoDiscountsSnap.docs.map(d => d.data() as AutoDiscount);
    const orders = ordersSnap.docs.map(d => d.data() as Order);

    return {
      settings,
      products,
      stocks,
      channels,
      autoDiscounts,
      orders
    };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, 'all_collections', auth);
  }
}

// Individual item updates for continuous syncing
export async function saveProductToFirestore(product: Product) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`, auth);
  }
}

export async function deleteProductFromFirestore(productId: string) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`, auth);
  }
}

export async function saveStockToFirestore(stockItem: StockItem) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'stocks', stockItem.id), stockItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stocks/${stockItem.id}`, auth);
  }
}

export async function deleteStockFromFirestore(stockId: string) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'stocks', stockId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `stocks/${stockId}`, auth);
  }
}

export async function saveChannelToFirestore(channel: Channel) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'channels', channel.id), channel);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `channels/${channel.id}`, auth);
  }
}

export async function deleteChannelFromFirestore(channelId: string) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'channels', channelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `channels/${channelId}`, auth);
  }
}

export async function saveAutoDiscountToFirestore(discount: AutoDiscount) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'autoDiscounts', discount.id), discount);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `autoDiscounts/${discount.id}`, auth);
  }
}

export async function deleteAutoDiscountFromFirestore(discountId: string) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'autoDiscounts', discountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `autoDiscounts/${discountId}`, auth);
  }
}

export async function saveOrderToFirestore(order: Order) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`, auth);
  }
}

export async function deleteOrderFromFirestore(orderId: string) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`, auth);
  }
}

export async function saveSettingsToFirestore(settings: {
  brandName: string;
  brandLogo: string;
  brandProfile: string;
  brandFooter: string;
  appFont: string;
  appFontWeight: string;
  paymentMethods: string[];
  pencatatList: string[];
}) {
  const { db, auth } = getFirebaseServices();
  if (!db) return;
  try {
    await setDoc(doc(db, 'settings', 'app'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/app', auth);
  }
}
