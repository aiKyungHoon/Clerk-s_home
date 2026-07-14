import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwRLokWVQ9it--vfEKRoijtv3NrKeaQUI",
  authDomain: "clerk-s-home.firebaseapp.com",
  projectId: "clerk-s-home",
  storageBucket: "clerk-s-home.firebasestorage.app",
  messagingSenderId: "16406607304",
  appId: "1:16406607304:web:9bfad0f91f84e8e7eabcfd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newClerksData = [
  { username: "admin", email: "admin@clerk.com", name: "admin", role: "super", region: "전체", password: "adminpassword12" },
  { username: "leecy", email: "leecy@clerk.com", name: "이찬영 청년회장님", role: "super", region: "전체", password: "leecypassword12" },
  { username: "kimhk", email: "kimhk@clerk.com", name: "김현경 청년총무님", role: "super", region: "전체", password: "kimhkpassword12" },
  { username: "leehj", email: "leehj@clerk.com", name: "이현주 청년서기님", role: "super", region: "전체", password: "leehjpassword12" },
  { username: "hanyj", email: "hanyj@clerk.com", name: "한예지 청년심방과장", role: "super", region: "전체", password: "hanyjpassword12" },
  { username: "kimkh", email: "kimkh@clerk.com", name: "김경훈 관리자", role: "super", region: "전체", password: "kimkhpassword12" }
];

async function updateClerks() {
  console.log("Fetching current clerks...");
  const snapshot = await getDocs(collection(db, "clerks"));
  
  // Delete all existing documents in clerks collection to start fresh and avoid duplicates
  console.log("Cleaning up old database profiles...");
  for (const document of snapshot.docs) {
    console.log(`Deleting: ${document.id}`);
    await deleteDoc(doc(db, "clerks", document.id));
  }
  
  // Write the new clean profiles
  console.log("Writing new clean profiles...");
  for (const item of newClerksData) {
    const docId = item.username; // Use the short username as the document ID
    console.log(`Writing profile: ${item.name} (${docId})`);
    await setDoc(doc(db, "clerks", docId), {
      id: docId,
      username: item.username,
      email: item.email,
      name: item.name,
      role: item.role,
      region: item.region,
      password: item.password
    });
  }
  
  // Also preserve the default sangam regional manager
  console.log("Writing sangam regional manager profile...");
  await setDoc(doc(db, "clerks", "sangam"), {
    id: "sangam",
    username: "sangam",
    email: "sangam@clerk.com",
    name: "상암지역 총무",
    role: "region",
    region: "상암지역",
    password: "sangam1234"
  });

  console.log("Clerks database update complete!");
  process.exit(0);
}

updateClerks();
