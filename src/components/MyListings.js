// src/components/MyListings.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // Firestore instance
import { useAuth } from "../AuthContext"; // To get current user
import { collection, query, where, getDocs } from "firebase/firestore";

const MyListings = () => {
  const { currentUser } = useAuth(); // Get the current logged-in user
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Query Firestore for listings where the "createdBy" field matches the current user's email
        const q = query(
          collection(db, "companyData"),
          where("createdBy", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);

        const userListings = [];
        querySnapshot.forEach((doc) => {
          userListings.push({ id: doc.id, ...doc.data() });
        });

        setListings(userListings);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching listings: ", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchListings();
    }
  }, [currentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>My Listings</h2>
      {listings.length > 0 ? (
        <ul>
          {listings.map((listing) => (
            <li key={listing.id}>
              <strong>Company Name:</strong> {listing.companyName} <br />
              <strong>Job Type:</strong> {listing.jobType} <br />
              <strong>Stipend:</strong> {listing.stipend} <br />
              <strong>IIT Name:</strong> {listing.iitName} <br />
              <strong>Created At:</strong>{" "}
              {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}{" "}
              <br />
              <hr />
            </li>
          ))}
        </ul>
      ) : (
        <p>No listings found.</p>
      )}
    </div>
  );
};

export default MyListings;
