// src/components/Dashboard.js
import React, { useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Import Firestore and Firebase Auth
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Alert,
} from "@mui/material";

import { collection, doc, setDoc } from "firebase/firestore"; // Firestore methods

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
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
    documentId: "",
  });

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out user
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prevData) => {
        if (checked) {
          // If checkbox is checked, add the value to the array
          return { ...prevData, openFor: [...prevData.openFor, value] };
        } else {
          // If unchecked, remove the value from the array
          return {
            ...prevData,
            openFor: prevData.openFor.filter((item) => item !== value),
          };
        }
      });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: e.target.files[0] }); // Handle file input
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (imageFile) => {
    const formData = new FormData();
    // Split the filename to extract the name and extension
    const fileNameWithoutExtension = imageFile.name
      .split(".")
      .slice(0, -1)
      .join(".");

    // Generate a unique filename with the original name + timestamp + original extension
    const uniqueFileName = `${fileNameWithoutExtension}_${Date.now()}`;
    console.log(uniqueFileName);

    formData.append("file", imageFile);
    formData.append("upload_preset", "placement_default"); // Use your upload preset from Cloudinary
    formData.append("public_id", uniqueFileName); // Set a unique public ID for the file

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/placementinplace/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url; // Get the secure URL from Cloudinary response
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if at least one checkbox is selected
    if (formData.openFor.length === 0) {
      alert("Please select at least one option from BTech, IDD, or MTech.");
      setLoading(false);
      return; // Prevent form submission if none is selected
    }

    try {
      let screenshotURL = null;
      if (formData.mailScreenshot) {
        screenshotURL = await uploadImageToCloudinary(formData.mailScreenshot); // Upload to Cloudinary and get URL
      }

      // Generate a Firestore document reference (to get the unique documentId)
      const docRef = doc(collection(db, "companyData"));
      const documentId = docRef.id; // Firestore auto-generated unique document ID

      // Update formData with the generated documentId
      setFormData((prevData) => ({ ...prevData, documentId }));

      // Save form data to Firestore (including the image URL and documentId)
      await setDoc(docRef, {
        companyName: formData.companyName,
        jobType: formData.jobType,
        stipend: formData.stipend,
        role: formData.role,
        hrDetails: formData.hrDetails,
        openFor: formData.openFor, // Array of selected options
        pptDate: formData.pptDate,
        oaDate: formData.oaDate,
        mailScreenshot: screenshotURL, // Store the Cloudinary URL in Firestore
        finalHiringNumber: formData.finalHiringNumber,
        iitName: formData.iitName, // IIT Name field
        createdBy: currentUser.email, // Optional: add user email
        createdAt: new Date(), // Timestamp
        documentId: documentId, // Add the unique Firestore document ID
      });
      console.log(documentId);
      // Manually create new FormData for Google Sheets
      const newFormData = new FormData();
      newFormData.append("documentId", documentId); // Append documentId
      console.log("Appended documentId: ", documentId);

      newFormData.append("companyName", formData.companyName);
      newFormData.append("jobType", formData.jobType);
      newFormData.append("stipend", formData.stipend);
      newFormData.append("role", formData.role);
      newFormData.append("hrDetails", formData.hrDetails);
      newFormData.append("openFor", formData.openFor.join(", ")); // Convert array to string
      newFormData.append("pptDate", formData.pptDate);
      newFormData.append("oaDate", formData.oaDate);
      newFormData.append("mailScreenshot", screenshotURL); // Append Cloudinary URL
      newFormData.append("finalHiringNumber", formData.finalHiringNumber);
      newFormData.append("iitName", formData.iitName);

      // Submit the form data to Google Sheets
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwa0O1F3lOXF-QBiAgWUpAkKtmXz5-8yIzdBkXS0dmPuwu239_pofG-kNgs6Dzca52zUg/exec",
        {
          method: "POST",
          body: newFormData, // Send the manually created FormData object
        }
      );

      const data = await response.text();
      console.log("Success:", data);
      alert("Data successfully submitted to Firestore and Google Sheets!");

      // Reset the form data to initial state after submission
      setFormData({
        companyName: "",
        jobType: "Intern", // Default to Intern
        stipend: "",
        role: "",
        hrDetails: "",
        openFor: [], // Reset the checkboxes
        pptDate: "",
        oaDate: "",
        mailScreenshot: null,
        finalHiringNumber: "",
        iitName: "", // Reset IIT Name field
        documentId: "", // Reset documentId
      });
      fileInputRef.current.value = null;
      setLoading(false);
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert("Error submitting data, please try again.");
      setLoading(false);
    }
  };

  // Navigate to My Listings
  const goToMyListings = () => {
    navigate("/mylistings");
  };
  const goToallListings = () => {
    navigate("/alllistings");
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser.email}
        </Typography>
        {/* Top Section: My Listings, All Listings on the left; Log Out on the right */}
        <Box
          sx={{
            mt: 4,
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Left side buttons: My Listings, All Listings */}
          <Box>
            <Button onClick={goToMyListings} variant="outlined" color="primary" sx={{ mr: 2 }}>
              My Listings
            </Button>
            <Button onClick={goToallListings} variant="outlined" color="primary">
              All Listings
            </Button>
          </Box>

          {/* Right side: Log Out */}
          <Button onClick={handleLogout} variant="outlined" color="error">
            Log Out
          </Button>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <FormLabel>Job Type</FormLabel>
          <RadioGroup
            row // Add 'row' prop to display radio buttons horizontally
            name="jobType"
            value={formData.jobType}
            onChange={handleChange}
          >
            <FormControlLabel
              value="Intern"
              control={<Radio />}
              label="Intern"
            />
            <FormControlLabel
              value="FTE"
              control={<Radio />}
              label="FTE"
            />
          </RadioGroup>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Stipend"
            name="stipend"
            type="number"
            value={formData.stipend}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="HR Details (Optional)"
            name="hrDetails"
            value={formData.hrDetails}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl margin="normal" fullWidth>
          <FormLabel>Open For</FormLabel>
          <FormGroup row> {/* Add 'row' prop to display checkboxes horizontally */}
            <FormControlLabel
              control={
                <Checkbox
                  name="openFor"
                  value="BTech"
                  checked={formData.openFor.includes("BTech")}
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                />
              }
              label="MTech"
            />
          </FormGroup>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <TextField
            label="PPT Date"
            name="pptDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.pptDate}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="OA Date"
            name="oaDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.oaDate}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <FormLabel>Mail Screenshot (file upload)</FormLabel>
          <input
            type="file"
            name="mailScreenshot"
            onChange={handleChange}
            accept="image/*"
            ref={fileInputRef}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="Final Hiring Number"
            name="finalHiringNumber"
            type="number"
            value={formData.finalHiringNumber}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="IIT Name"
            name="iitName"
            value={formData.iitName}
            onChange={handleChange}
            required
          />
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Container>
  );
};
export default Dashboard;
