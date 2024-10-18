import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase"; // Firestore instance
import Modal from "react-modal"; // Import Modal component
import { collection, getDocs } from "firebase/firestore"; // Firestore methods

// Modal styling
const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const AllListings = () => {
  const [listings, setListings] = useState([]); // All listings
  const [filteredListings, setFilteredListings] = useState([]); // Filtered listings based on search
  const [modalIsOpen, setModalIsOpen] = useState(false); // Control modal visibility
  const [selectedListing, setSelectedListing] = useState(null); // The selected IIT listing for the modal
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order (ascending)

  // Fetch all listings from Firebase
  const fetchListings = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "companyData"));
      const allListings = [];

      querySnapshot.forEach((doc) => {
        allListings.push({ id: doc.id, ...doc.data() });
      });

      // Group listings by company name
      const grouped = allListings.reduce((acc, listing) => {
        const companyName = listing.companyName.toLowerCase();
        if (!acc[companyName]) {
          acc[companyName] = {
            companyName: listing.companyName,
            iits: [],
          };
        }
        acc[companyName].iits.push(listing);
        return acc;
      }, {});

      const groupedArray = Object.values(grouped); // Convert the grouped object to an array
      setListings(groupedArray);
      setFilteredListings(groupedArray); // Initially, all listings are displayed
    } catch (error) {
      console.error("Error fetching listings: ", error);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Open modal to show IIT details for a particular company
  const openModal = (listing) => {
    setSelectedListing(listing);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedListing(null);
  };

  // Handle search term change
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);

    if (query === "") {
      // Reset filtered listings if the search term is empty
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter((group) =>
        group.companyName.toLowerCase().startsWith(query)
      );
      setFilteredListings(filtered);
    }
  };

  // Sorting function using sortOrder
  const handleSort = (field) => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedListings = [...filteredListings].sort((a, b) => {
      const fieldA = a[field] ?? ""; // Use optional chaining in case the field is undefined
      const fieldB = b[field] ?? "";
      if (newSortOrder === "asc") {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    setFilteredListings(sortedListings);
  };

  return (
    <div>
      <h2>All Company Listings</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search company..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {/* Sort options */}
      <div>
        <span>Sort by: </span>
        <button onClick={() => handleSort("companyName")}>Company Name</button>
        <button onClick={() => handleSort("pptDate")}>PPT Date</button>
        <button onClick={() => handleSort("oaDate")}>OA Date</button>
        <button onClick={() => handleSort("stipend")}>Stipend</button>
      </div>

      {/* Listings Display */}
      {filteredListings.length > 0 ? (
        <div>
          {filteredListings.map((group) => (
            <div
              key={group.companyName}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "20px",
              }}
            >
              <h3>{group.companyName}</h3>
              <p>IITs that have listed this company:</p>
              <ul>
                {group.iits.map((listing) => (
                  <li key={listing.id}>
                    <button
                      style={{
                        backgroundColor: listing.openFor.includes("MTech")
                          ? "green"
                          : "red",
                        color: "white",
                        padding: "5px",
                        marginRight: "10px",
                      }}
                      onClick={() => openModal(listing)}
                    >
                      {listing.iitName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p>No listings found.</p>
      )}

      {/* Modal to show IIT-specific details */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
      >
        {selectedListing && (
          <div>
            <h3>
              {selectedListing.companyName} - {selectedListing.iitName}
            </h3>
            <p>
              <strong>Job Type:</strong> {selectedListing.jobType}
            </p>
            <p>
              <strong>Stipend:</strong> {selectedListing.stipend}
            </p>
            <p>
              <strong>Role:</strong> {selectedListing.role}
            </p>
            <p>
              <strong>HR Details:</strong> {selectedListing.hrDetails || "N/A"}
            </p>
            <p>
              <strong>Open For:</strong> {selectedListing.openFor.join(", ")}
            </p>
            <p>
              <strong>PPT Date:</strong> {selectedListing.pptDate || "N/A"}
            </p>
            <p>
              <strong>OA Date:</strong> {selectedListing.oaDate || "N/A"}
            </p>
            <p>
              <strong>Final Hiring Number:</strong>{" "}
              {selectedListing.finalHiringNumber || "N/A"}
            </p>
            <p>
              <strong>Mail Screenshot:</strong>{" "}
              {selectedListing.mailScreenshot ? (
                <a
                  href={selectedListing.mailScreenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Screenshot
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(
                selectedListing.createdAt.seconds * 1000
              ).toLocaleDateString()}
            </p>
            <button onClick={closeModal}>Close</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllListings;
