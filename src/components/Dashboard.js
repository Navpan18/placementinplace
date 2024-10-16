// src/components/Dashboard.js
import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Import Firestore and Firebase Auth
import { collection, addDoc } from "firebase/firestore"; // Firestore methods
import { 
  Box, 
  Button, 
  Checkbox, 
  Container, 
  FormControlLabel, 
  Radio, 
  RadioGroup, 
  TextField, 
  Typography, 
  CircularProgress 
} from "@mui/material";
import { StyledContainer, StyledForm, StyledTextField, StyledButton } from "./DashboardStyles"; // Import styled components


const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    jobType: "Intern", // Default to Intern
    stipend: "",
    hrDetails: "",
    openFor: [],
    pptDate: "",
    oaDate: "",
    mailScreenshot: null,
    finalHiringNumber: "",
    iitName: "", // IIT Name field
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
  // Handle form submission
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Check if at least one checkbox is selected
    if (formData.openFor.length === 0) {
      alert("Please select at least one option from BTech, IDD, or MTech.");
      return; // Prevent form submission if none is selected
    }
    try {
      let screenshotURL = null;
      if (formData.mailScreenshot) {
        screenshotURL = await uploadImageToCloudinary(formData.mailScreenshot); // Upload to Cloudinary and get URL
      }

      // Ensure the openFor array has been updated correctly before submitting
      console.log("openFor array before submitting:", formData.openFor);

      // Save form data to Firestore (including the image URL from Cloudinary)
      await addDoc(collection(db, "companyData"), {
        companyName: formData.companyName,
        jobType: formData.jobType,
        stipend: formData.stipend,
        hrDetails: formData.hrDetails,
        openFor: formData.openFor, // Make sure this is updated correctly
        pptDate: formData.pptDate,
        oaDate: formData.oaDate,
        mailScreenshot: screenshotURL, // Store the Cloudinary URL in Firestore
        finalHiringNumber: formData.finalHiringNumber,
        iitName: formData.iitName, // IIT Name field
        createdBy: currentUser.email, // Optional: add user email
        createdAt: new Date(), // Timestamp
      });

      alert("Data successfully submitted!");

      // Reset the form data to initial state after submission
      setFormData({
        companyName: "",
        jobType: "Intern", // Default to Intern
        stipend: "",
        hrDetails: "",
        openFor: [],
        pptDate: "",
        oaDate: "",
        mailScreenshot: null,
        finalHiringNumber: "",
        iitName: "", // Reset IIT Name field
      });
      setLoading(false);
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert("Error submitting data, please try again.");
    }
  };

  return (
    <StyledContainer>
      <Box 
  sx={{ 
    display: "flex", 
    justifyContent: { xs: "center", md: "space-between" }, 
    alignItems: "center", 
    flexDirection: { xs: "column", md: "row" },  // Stack vertically on small screens
    width: "52%", // Ensure it uses full width
    marginBottom: 2
  }}
>
      <Typography variant="h5">
        Welcome, {currentUser.email.split('@')[0]}
      </Typography>
      <StyledButton onClick={handleLogout} variant="contained" color="secondary">
        Log Out
      </StyledButton>
    </Box>

    <StyledForm onSubmit={handleSubmit}>
      <TextField
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        fullWidth
        required
      />
<Box sx={{ display: "flex", flexDirection: "row", gap: 2,marginTop:1}}>
      <Typography variant="body1" sx={{ marginTop: 1.1 }}>
        Intern or FTE:
      </Typography>
     
      <RadioGroup
        name="jobType"
        value={formData.jobType}
        onChange={handleChange}
        sx={{ flexDirection: "row",justifyContent:"space-around", marginBottom: 2 }}
      > 
        <FormControlLabel value="Intern" control={<Radio />} label="Intern" />
        <FormControlLabel value="FTE" control={<Radio />} label="FTE" />
      </RadioGroup>
      </Box>
      <StyledTextField>
        <TextField
          label="Stipend Amount"
          name="stipend"
          type="number"
          value={formData.stipend}
          onChange={handleChange}
          fullWidth
          required
        />
      </StyledTextField>

      <StyledTextField>
        <TextField
          label="HR Details (Optional)"
          name="hrDetails"
          value={formData.hrDetails}
          onChange={handleChange}
          fullWidth
        />
      </StyledTextField>

      
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, marginBottom: 2}}>
      <Typography variant="body1" sx={{ marginTop: 1 }}>
        Open For:
      </Typography>
      <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "space-evenly" }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.openFor.includes("BTech")}
            onChange={handleChange}
            name="openFor"
            value="BTech"
          />
        }
        label="BTech"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.openFor.includes("IDD")}
            onChange={handleChange}
            name="openFor"
            value="IDD"
          />
        }
        label="IDD"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.openFor.includes("MTech")}
            onChange={handleChange}
            name="openFor"
            value="MTech"
          />
        }
        label="MTech"
      />
      </Box>
</Box>
      <StyledTextField>
        <TextField
          label="PPT Date"
          name="pptDate"
          type="date"
          value={formData.pptDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      </StyledTextField>

      <StyledTextField>
        <TextField
          label="OA Date"
          name="oaDate"
          type="date"
          value={formData.oaDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      </StyledTextField>

      <StyledTextField>
        <TextField
          label="Mail Screenshot"
          name="mailScreenshot"
          type="file"
          onChange={handleChange}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
          required
        />
      </StyledTextField>

      <StyledTextField>
        <TextField
          label="Final Hiring Number"
          name="finalHiringNumber"
          type="number"
          value={formData.finalHiringNumber}
          onChange={handleChange}
          fullWidth
        />
      </StyledTextField>

      <StyledTextField>
        <TextField
          label="IIT Name"
          name="iitName"
          value={formData.iitName}
          onChange={handleChange}
          fullWidth
          required
        />
      </StyledTextField>

      <StyledButton
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Submit"}
      </StyledButton>
    </StyledForm>
  </StyledContainer>
  );
};

export default Dashboard;
