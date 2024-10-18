import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../firebase"; // Firestore instance
import { useAuth } from "../AuthContext"; // To get current user
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
  const goToallListings = () => {
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
    console.log(uniqueFileName);

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

      // Create new FormData for Google Sheets
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

      // Submit the form data to Google Sheets
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzqF8aBw9Qp422Z2mDf2XjPUtWL84Hoa5d0CXNqFeGCdtHu2Ybm4s80bfgyjBwyZFyRxw/exec",
        {
          method: "POST",
          body: newFormData,
        }
      );

      const result = await response.text();
      console.log(result);

      // After successful edit, reset the form and close the edit mode
      setModalIsOpen(false); // Close the modal after saving
      alert("Listing updated successfully!");

      // Re-fetch the listings to show updated data
      fetchListings();
    } catch (error) {
      console.error("Error updating listing: ", error);
    } finally {
      setModalLoading(false); // Hide modal loading
    }
  };

  // Close modal function
  const closeModal = () => {
    setModalIsOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>My Listings</h2>
      <button onClick={goToallListings}>All Listings</button>
      <button onClick={goToDashboard}>Back</button>
      {listings.length > 0 ? (
        <ul>
          {listings.map((listing) => (
            <li key={listing.id}>
              <strong>Company Name:</strong> {listing.companyName} <br />
              <strong>Job Type:</strong> {listing.jobType} <br />
              <strong>Stipend:</strong> {listing.stipend} <br />
              <strong>Role:</strong> {listing.role} <br />
              <strong>HR Details:</strong> {listing.hrDetails || "N/A"} <br />
              <strong>Open For:</strong> {listing.openFor.join(", ") || "N/A"}{" "}
              <br />
              <strong>PPT Date:</strong> {listing.pptDate || "N/A"} <br />
              <strong>OA Date:</strong> {listing.oaDate || "N/A"} <br />
              <strong>Mail Screenshot:</strong>{" "}
              {listing.mailScreenshot ? (
                <a
                  href={listing.mailScreenshot}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Screenshot
                </a>
              ) : (
                "N/A"
              )}{" "}
              <br />
              <strong>Final Hiring Number:</strong>{" "}
              {listing.finalHiringNumber || "N/A"} <br />
              <strong>IIT Name:</strong> {listing.iitName} <br />
              <strong>Created At:</strong>{" "}
              {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}{" "}
              <br />
              <button onClick={() => handleEditClick(listing)}>Edit</button>
              <hr />
            </li>
          ))}
        </ul>
      ) : (
        <p>No listings found.</p>
      )}

      {/* Edit form in a modal popup */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Listing Modal"
        style={customStyles} // Apply custom styles to modal
      >
        <h3>Edit Listing</h3>
        <form onSubmit={handleEditSubmit}>
          <label>
            Company Name:
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            Job Type:
            <input
              type="radio"
              name="jobType"
              value="Intern"
              checked={formData.jobType === "Intern"}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
            Intern
            <input
              type="radio"
              name="jobType"
              value="FTE"
              checked={formData.jobType === "FTE"}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
            FTE
          </label>
          <br />
          <label>
            Stipend:
            <input
              type="number"
              name="stipend"
              value={formData.stipend}
              onChange={handleInputChange}
              required
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            Role:
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            HR Details:
            <input
              type="text"
              name="hrDetails"
              value={formData.hrDetails}
              onChange={handleInputChange}
              placeholder="Enter HR contact details"
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            Open For:
            <input
              type="checkbox"
              name="openFor"
              value="BTech"
              checked={formData.openFor.includes("BTech")}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
            BTech
            <input
              type="checkbox"
              name="openFor"
              value="IDD"
              checked={formData.openFor.includes("IDD")}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
            IDD
            <input
              type="checkbox"
              name="openFor"
              value="MTech"
              checked={formData.openFor.includes("MTech")}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
            MTech
          </label>
          <br />
          <label>
            PPT Date:
            <input
              type="date"
              name="pptDate"
              value={formData.pptDate}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            OA Date:
            <input
              type="date"
              name="oaDate"
              value={formData.oaDate}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            Mail Screenshot:
            <input
              type="file"
              name="mailScreenshot"
              ref={fileInputRef}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            Final Hiring Number:
            <input
              type="number"
              name="finalHiringNumber"
              value={formData.finalHiringNumber}
              onChange={handleInputChange}
              disabled={modalLoading}
            />
          </label>
          <br />
          <label>
            IIT Name:
            <input
              type="text"
              name="iitName"
              value={formData.iitName}
              onChange={handleInputChange}
              required
              disabled={modalLoading}
            />
          </label>
          <br />
          <button type="submit" disabled={modalLoading}>
            {modalLoading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={closeModal} disabled={modalLoading}>
            Cancel
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MyListings;
