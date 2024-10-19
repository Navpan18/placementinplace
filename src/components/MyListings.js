import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../firebase"; // Firestore instance
import { useAuth } from "../AuthContext"; // To get current user

import Zoom from 'react-medium-image-zoom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
  CardActions
} from "@mui/material";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore"; // Firestore methods
import Modal from "react-modal"; // Import the Modal component
import { useNavigate } from "react-router-dom";

// Modal styling
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "600px", // Customize width
    maxHeight: "90vh", // Ensure modal doesn't overflow vertically
    overflowY: "auto", // Enable scroll if content is too long
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background for overlay
  },
};

const MyListings = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get the current logged-in user
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true); // General page loading
  const [modalLoading, setModalLoading] = useState(false); // Modal-specific loading
  const [modalIsOpen, setModalIsOpen] = useState(false); // Control modal visibility
  const fileInputRef = useRef(null); // Ref for file input
  const [imageModalOpen, setImageModalOpen] = useState(false); // Control image modal visibility
  const [selectedImage, setSelectedImage] = useState(""); // Store the image URL for modal

  const [formData, setFormData] = useState({
    companyName: "",
    jobType: "Intern", // Default to Intern
    stipend: "",
    role: "", // Add role field
    hrDetails: "",
    openFor: [],
    pptDate: "",
    oaDate: "",
    mailScreenshot: null,
    finalHiringNumber: "",
    iitName: "", // IIT Name field
    documentId: "", // Document ID field for identifying the listing
  });

  const goToAllListings = () => {
    navigate("/alllistings");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // Function to fetch listings
  const fetchListings = useCallback(async () => {
    try {
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
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchListings();
    }
  }, [currentUser, fetchListings]);

  const uploadImageToCloudinary = async (imageFile) => {
    const cloudinaryFormData = new FormData();
    const fileNameWithoutExtension = imageFile.name
      .split(".")
      .slice(0, -1)
      .join(".");

    const uniqueFileName = `${fileNameWithoutExtension}_${Date.now()}`;

    cloudinaryFormData.append("file", imageFile);
    cloudinaryFormData.append("upload_preset", "placement_default"); // Your upload preset
    cloudinaryFormData.append("public_id", uniqueFileName); // Set unique public ID

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/placementinplace/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    const data = await response.json();
    return data.secure_url; // Get the secure URL from Cloudinary response
  };

  // Handle form input change for editing
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prevData) => {
        if (checked) {
          return { ...prevData, openFor: [...prevData.openFor, value] };
        } else {
          return {
            ...prevData,
            openFor: prevData.openFor.filter((item) => item !== value),
          };
        }
      });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Function to open the edit form and populate it with existing data
  const handleEditClick = (listing) => {
    setFormData({
      companyName: listing.companyName || "",
      jobType: listing.jobType || "Intern",
      stipend: listing.stipend || "",
      role: listing.role || "",
      hrDetails: listing.hrDetails || "",
      openFor: listing.openFor || [],
      pptDate: listing.pptDate || "",
      oaDate: listing.oaDate || "",
      mailScreenshot: listing.mailScreenshot || null,
      finalHiringNumber: listing.finalHiringNumber || "",
      iitName: listing.iitName || "",
      documentId: listing.id,
    });
    setModalIsOpen(true); // Open modal when editing
  };

  // Handle form submission and updating both Firestore and Google Sheets
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true); // Show loading only on modal

    // Upload image to Cloudinary if a new one is selected
    let screenshotURL = formData.mailScreenshot;
    if (fileInputRef.current?.files?.length) {
      screenshotURL = await uploadImageToCloudinary(formData.mailScreenshot); // Upload to Cloudinary
    }

    try {
      const docRef = doc(db, "companyData", formData.documentId);

      // Update Firestore with edited data
      await updateDoc(docRef, {
        companyName: formData.companyName,
        jobType: formData.jobType,
        stipend: formData.stipend,
        role: formData.role,
        hrDetails: formData.hrDetails,
        openFor: formData.openFor,
        pptDate: formData.pptDate,
        oaDate: formData.oaDate,
        mailScreenshot: screenshotURL,
        finalHiringNumber: formData.finalHiringNumber,
        iitName: formData.iitName,
      });

      // Submit the form data to Google Sheets
      const newFormData = new FormData();
      newFormData.append("documentId", formData.documentId); // Append documentId
      newFormData.append("companyName", formData.companyName);
      newFormData.append("jobType", formData.jobType);
      newFormData.append("stipend", formData.stipend);
      newFormData.append("role", formData.role);
      newFormData.append("hrDetails", formData.hrDetails);
      newFormData.append("openFor", formData.openFor.join(", ")); // Convert array to string
      newFormData.append("pptDate", formData.pptDate);
      newFormData.append("oaDate", formData.oaDate);
      newFormData.append("mailScreenshot", screenshotURL);
      newFormData.append("finalHiringNumber", formData.finalHiringNumber);
      newFormData.append("iitName", formData.iitName);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzqF8aBw9Qp422Z2mDf2XjPUtWL84Hoa5d0CXNqFeGCdtHu2Ybm4s80bfgyjBwyZFyRxw/exec",
        {
          method: "POST",
          body: newFormData,
        }
      );

      const result = await response.text();
      console.log(result);

      setModalIsOpen(false); // Close the modal after saving
      alert("Listing updated successfully!");

      fetchListings(); // Re-fetch the listings to show updated data
    } catch (error) {
      console.error("Error updating listing: ", error);
    } finally {
      setModalLoading(false); // Hide modal loading
    }
  };

  const handleViewScreenshot = (imageUrl) => {
    window.open(imageUrl, "_blank");
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4">My Listings</Typography>
        <Box>
          <Button onClick={goToAllListings} variant="contained" color="primary" sx={{ mr: 2 }}>
            All Listings
          </Button>
          <Button onClick={goToDashboard} variant="outlined" color="secondary">
            Back
          </Button>
        </Box>
      </Box>

      {listings.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)', // 1 card on mobile
              sm: 'repeat(2, 1fr)', // 2 cards on tablets
              md: 'repeat(3, 1fr)', // 3 cards on desktops
            },
            gap: 3
          }}
        >
          {listings.map((listing) => (
            <Card key={listing.id} sx={{ padding: 2 }}>
              <CardContent>
                <Typography variant="h6">{listing.companyName}</Typography>
                <Typography>Job Type: {listing.jobType}</Typography>
                <Typography>Stipend: {listing.stipend}</Typography>
                <Typography>Role: {listing.role}</Typography>
                <Typography>HR Details: {listing.hrDetails || "N/A"}</Typography>
                <Typography>
                  Open For: {listing.openFor.join(", ") || "N/A"}
                </Typography>
                <Typography>PPT Date: {listing.pptDate || "N/A"}</Typography>
                <Typography>OA Date: {listing.oaDate || "N/A"}</Typography>
                <Typography>
                  Mail Screenshot:{" "}
                  {listing.mailScreenshot ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleViewScreenshot(listing.mailScreenshot)}
                    >
                      View
                    </Button>
                  ) : (
                    "N/A"
                  )}
                </Typography>
                <Typography>
                  Final Hiring Number: {listing.finalHiringNumber || "N/A"}
                </Typography>
                <Typography>IIT Name: {listing.iitName}</Typography>
              </CardContent>
              <CardActions>
                <Button onClick={() => handleEditClick(listing)} variant="contained">
                  Edit
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography>No listings found.</Typography>
      )}

      {/* Modal to view image */}
      <Dialog
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>View Screenshot</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Zoom>
              <img
                src={selectedImage}
                alt="Screenshot"
                style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
              />
            </Zoom>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit form in a modal popup */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Listing Modal"
        style={customStyles}
      >
        <Typography variant="h6">Edit Listing</Typography>
        <form onSubmit={handleEditSubmit}>
          <TextField
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={modalLoading}
          />
          <FormControl fullWidth margin="normal">
            <Typography>Job Type:</Typography>
            <RadioGroup
              row
              name="jobType"
              value={formData.jobType}
              onChange={handleInputChange}
              disabled={modalLoading}
            >
              <FormControlLabel value="Intern" control={<Radio />} label="Intern" />
              <FormControlLabel value="FTE" control={<Radio />} label="FTE" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Stipend"
            name="stipend"
            type="number"
            value={formData.stipend}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={modalLoading}
          />
          <TextField
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={modalLoading}
          />
          <TextField
            label="HR Details"
            name="hrDetails"
            value={formData.hrDetails}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            placeholder="Enter HR contact details"
            disabled={modalLoading}
          />
          <FormControl margin="normal" fullWidth>
            <Typography>Open For:</Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    name="openFor"
                    value="BTech"
                    checked={formData.openFor.includes("BTech")}
                    onChange={handleInputChange}
                    disabled={modalLoading}
                  />
                }
                label="BTech"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="openFor"
                    value="IDD"
                    checked={formData.openFor.includes("IDD")}
                    onChange={handleInputChange}
                    disabled={modalLoading}
                  />
                }
                label="IDD"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="openFor"
                    value="MTech"
                    checked={formData.openFor.includes("MTech")}
                    onChange={handleInputChange}
                    disabled={modalLoading}
                  />
                }
                label="MTech"
              />
            </FormGroup>
          </FormControl>

          <TextField
            label="PPT Date"
            name="pptDate"
            type="date"
            value={formData.pptDate}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={modalLoading}
          />
          <TextField
            label="OA Date"
            name="oaDate"
            type="date"
            value={formData.oaDate}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={modalLoading}
          />
          <Typography>Mail Screenshot:</Typography>
          <input
            type="file"
            name="mailScreenshot"
            ref={fileInputRef}
            onChange={handleInputChange}
            disabled={modalLoading}
            style={{ marginBottom: "16px" }}
          />
          <TextField
            label="Final Hiring Number"
            name="finalHiringNumber"
            type="number"
            value={formData.finalHiringNumber}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            disabled={modalLoading}
          />
          <TextField
            label="IIT Name"
            name="iitName"
            value={formData.iitName}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={modalLoading}
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
            <Button type="submit" variant="contained" disabled={modalLoading}>
              {modalLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" onClick={closeModal} variant="outlined" disabled={modalLoading}>
              Cancel
            </Button>
          </Box>
        </form>
      </Modal>
    </Container>
  );
};

export default MyListings;