import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase"; // Firestore instance
import Modal from "react-modal"; // Import Modal component
import { collection, getDocs } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
} from "@mui/material";

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
  const navigate = useNavigate();
  const [listings, setListings] = useState([]); // All listings
  const [filteredListings, setFilteredListings] = useState([]); // Filtered listings based on search
  const [modalIsOpen, setModalIsOpen] = useState(false); // Control modal visibility
  const [selectedListing, setSelectedListing] = useState(null); // The selected IIT listing for the modal
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order (ascending)
  const goToDashboard = () => {
    navigate("/dashboard");
  };
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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          All Company Listings
        </Typography>
        <Button onClick={goToDashboard} variant="outlined" color="secondary">
          Back
        </Button>
        {/* Search Bar */}
        <TextField
          label="Search company..."
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={handleSearchChange}
        />

        {/* Sort options */}
        <Box sx={{ my: 2 }}>
          <Typography variant="h6">Sort by:</Typography>
          <Button onClick={() => handleSort("companyName")} variant="contained" sx={{ mr: 1 }}>
            Company Name
          </Button>
          <Button onClick={() => handleSort("pptDate")} variant="contained" sx={{ mr: 1 }}>
            PPT Date
          </Button>
          <Button onClick={() => handleSort("oaDate")} variant="contained" sx={{ mr: 1 }}>
            OA Date
          </Button>
          <Button onClick={() => handleSort("stipend")} variant="contained">
            Stipend
          </Button>
        </Box>

        {/* Listings Display */}
        {filteredListings.length > 0 ? (
          <Grid container spacing={3}>
            {filteredListings.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.companyName}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {group.companyName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      IITs that have listed this company:
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {group.iits.map((listing) => (
                        <Button
                          key={listing.id}
                          variant="contained"
                          color={listing.openFor.includes("MTech") ? "success" : "error"}
                          sx={{ mb: 1, mr: 1 }}
                          onClick={() => openModal(listing)}
                        >
                          {listing.iitName}
                        </Button>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>No listings found.</Typography>
        )}

        {/* Modal to show IIT-specific details */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customModalStyles}
        >
          {selectedListing && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                {selectedListing.companyName} - {selectedListing.iitName}
              </Typography>
              <Typography>
                <strong>Job Type:</strong> {selectedListing.jobType}
              </Typography>
              <Typography>
                <strong>Stipend:</strong> {selectedListing.stipend}
              </Typography>
              <Typography>
                <strong>Role:</strong> {selectedListing.role}
              </Typography>
              <Typography>
                <strong>HR Details:</strong> {selectedListing.hrDetails || "N/A"}
              </Typography>
              <Typography>
                <strong>Open For:</strong> {selectedListing.openFor.join(", ")}
              </Typography>
              <Typography>
                <strong>PPT Date:</strong> {selectedListing.pptDate || "N/A"}
              </Typography>
              <Typography>
                <strong>OA Date:</strong> {selectedListing.oaDate || "N/A"}
              </Typography>
              <Typography>
                <strong>Final Hiring Number:</strong>{" "}
                {selectedListing.finalHiringNumber || "N/A"}
              </Typography>
              <Typography>
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
              </Typography>
              <Typography>
                <strong>Created At:</strong>{" "}
                {new Date(
                  selectedListing.createdAt.seconds * 1000
                ).toLocaleDateString()}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={closeModal}
              >
                Close
              </Button>
            </Box>
          )}
        </Modal>
      </Box>
    </Container>
  );
};

export default AllListings;