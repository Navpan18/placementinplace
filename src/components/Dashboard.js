// src/components/Dashboard.js
import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Import Firestore and Firebase Auth
import { collection, addDoc } from "firebase/firestore"; // Firestore methods

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
    <div>
      <h2>Welcome, {currentUser.email}</h2>
      <button onClick={handleLogout}>Log Out</button>

      <form onSubmit={handleSubmit}>
        {/* Company Name */}
        <div>
          <label>Company Name:</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
            required
          />
        </div>

        {/* Intern or FTE */}
        <div>
          <label>Intern or FTE:</label>
          <input
            type="radio"
            name="jobType"
            value="Intern"
            checked={formData.jobType === "Intern"}
            onChange={handleChange}
          />{" "}
          Intern
          <input
            type="radio"
            name="jobType"
            value="FTE"
            checked={formData.jobType === "FTE"}
            onChange={handleChange}
          />{" "}
          FTE
        </div>

        {/* Stipend Amount */}
        <div>
          <label>Stipend Amount:</label>
          <input
            type="number"
            name="stipend"
            value={formData.stipend}
            onChange={handleChange}
            placeholder="Enter stipend amount"
            required
          />
        </div>

        {/* HR Details (Optional) */}
        <div>
          <label>HR Details (if available):</label>
          <input
            type="text"
            name="hrDetails"
            value={formData.hrDetails}
            onChange={handleChange}
            placeholder="Enter HR contact details"
          />
        </div>

        {/* Open For (BTech, IDD, MTech) */}
        <div>
          <label>Open For:</label>
          <input
            type="checkbox"
            name="openFor"
            value="BTech"
            checked={formData.openFor.includes("BTech")}
            onChange={handleChange}
          />{" "}
          BTech
          <input
            type="checkbox"
            name="openFor"
            value="IDD"
            checked={formData.openFor.includes("IDD")}
            onChange={handleChange}
          />{" "}
          IDD
          <input
            type="checkbox"
            name="openFor"
            value="MTech"
            checked={formData.openFor.includes("MTech")}
            onChange={handleChange}
          />{" "}
          MTech
        </div>

        {/* PPT Date */}
        <div>
          <label>PPT Date:</label>
          <input
            type="date"
            name="pptDate"
            value={formData.pptDate}
            onChange={handleChange}
          />
        </div>

        {/* OA Date */}
        <div>
          <label>OA Date:</label>
          <input
            type="date"
            name="oaDate"
            value={formData.oaDate}
            onChange={handleChange}
          />
        </div>

        {/* Mail Screenshot (file upload) */}
        <div>
          <label>Mail Screenshot or any proof of opening for Mtechs :</label>
          <input
            type="file"
            name="mailScreenshot"
            onChange={handleChange}
            accept="image/*"
            required
          />
        </div>

        {/* Final Hiring Number */}
        <div>
          <label>Final Hiring Number:</label>
          <input
            type="number"
            name="finalHiringNumber"
            value={formData.finalHiringNumber}
            onChange={handleChange}
            placeholder="To be edited later"
          />
        </div>

        {/* IIT Name */}
        <div>
          <label>IIT Name:</label>
          <input
            type="text"
            name="iitName"
            value={formData.iitName}
            onChange={handleChange}
            placeholder="Enter IIT name"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;
