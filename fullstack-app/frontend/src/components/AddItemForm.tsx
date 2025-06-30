"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Item, itemsApi, uploadApi, authApi } from "@/services/api";

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Sports",
  "Books",
  "Toys",
  "Vehicles",
  "Beauty",
  "Services",
  "Other",
] ;

interface AddItemFormProps {
  editItem?: Item;
  onItemAdded?: (item: Item) => void;
}

export default function AddItemForm({
  editItem,
  onItemAdded,
}: AddItemFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [reserved, setReserved] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Set form values if editing an existing item
  useEffect(() => {
    if (editItem) {
      setName(editItem.name || "");
      setDescription(editItem.description || "");
      setCategory(editItem.category || CATEGORIES[0]);
      setLocation(editItem.location || "");
      setImageUrls(editItem.imageUrls || []);
      setReserved(editItem.reserved || false);
    }
  }, [editItem]);

  // Check if user is logged in
  useEffect(() => {
    if (!authApi.isLoggedIn()) {
      router.push("/login");
    }
  }, [router]);

  // Handle files from drag and drop or file input
  const handleFiles = useCallback(
    (fileList: FileList) => {
      const selectedFiles = Array.from(fileList);

      // Limit to 5 images total (existing + new)
      const totalImages =
        imageUrls.length + images.length + selectedFiles.length;
      if (totalImages > 5) {
        setError("You can upload a maximum of 5 images");
        return;
      }

      setImages([...images, ...selectedFiles]);

      // Create preview URLs for the selected images
      const newPreviewUrls = selectedFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);

      // Clear any previous errors
      setError(null);
    },
    [imageUrls.length, images, imagePreviewUrls],
  );

  // Set up drag and drop event listeners
  useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const highlight = () => {
      setDragActive(true);
    };

    const unhighlight = () => {
      setDragActive(false);
    };

    const handleDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (dt?.files) {
        handleFiles(dt.files);
      }
      unhighlight();
    };

    const dropArea = dropAreaRef.current;
    if (dropArea) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, preventDefaults, false);
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        dropArea.addEventListener(eventName, highlight, false);
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropArea.addEventListener(eventName, unhighlight, false);
      });

      dropArea.addEventListener("drop", handleDrop, false);

      return () => {
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
          dropArea.removeEventListener(eventName, preventDefaults);
        });

        ["dragenter", "dragover"].forEach((eventName) => {
          dropArea.removeEventListener(eventName, highlight);
        });

        ["dragleave", "drop"].forEach((eventName) => {
          dropArea.removeEventListener(eventName, unhighlight);
        });

        dropArea.removeEventListener("drop", handleDrop);
      };
    }
  }, [handleFiles]);

  // Handle image selection from file input
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Remove an image
  const handleRemoveImage = (index: number, type: "new" | "existing") => {
    if (type === "new") {
      // Remove from new images
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);

      // Remove preview URL
      const newPreviewUrls = [...imagePreviewUrls];
      URL.revokeObjectURL(newPreviewUrls[index]); // Clean up the URL
      newPreviewUrls.splice(index, 1);
      setImagePreviewUrls(newPreviewUrls);
    } else {
      // Remove from existing images
      const newImageUrls = [...imageUrls];
      newImageUrls.splice(index, 1);
      setImageUrls(newImageUrls);
    }
  };

  // Upload images to server
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) {
      return imageUrls; // Return existing image URLs if no new images
    }

    setUploadingImages(true);

    try {
      const uploadedImageUrls = await uploadApi.uploadImages(images);
      return [...imageUrls, ...uploadedImageUrls];
    } catch (err) {
      console.error("Error uploading images:", err);
      throw new Error("Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name || !description || !category) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload images first
      const allImageUrls = await uploadImages();

      // Create or update item
      const itemData: Item = {
        name,
        description,
        category,
        location: location || undefined,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
        reserved,
      };

      let savedItem: Item;

      if (editItem?.id) {
        // Update existing item
        savedItem = await itemsApi.update(editItem.id, itemData);
      } else {
        // Create new item
        savedItem = await itemsApi.create(itemData);
      }

      // Clean up preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

      // Reset form if not editing
      if (!editItem) {
        setName("");
        setDescription("");
        setCategory(CATEGORIES[0]);
        setLocation("");
        setImageUrls([]);
        setImages([]);
        setImagePreviewUrls([]);
        setReserved(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      // Call the callback if provided
      if (onItemAdded) {
        onItemAdded(savedItem);
      }

      // Redirect to item detail page if not using callback
      if (!onItemAdded && savedItem.id) {
        router.push(`/items/${savedItem.id}`);
      }
    } catch (err: unknown) {
      console.error("Error saving item:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save item. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div
        className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4"
        style={{
          backgroundColor: "var(--primary)",
          backgroundImage:
            "linear-gradient(to right, var(--primary), var(--primary-dark))",
        }}
      >
        <h2 className="text-xl font-bold text-black ">
          {editItem ? "Edit Your Item" : "Give Your Item"}
        </h2>
        <p className="text-green-100 text-sm mt-1">
          Fill in the details below to list your item to give away
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black  mb-4 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: "var(--primary)" }}
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Add Photos
            </h3>
            <p className="text-sm text-black  mb-4">
              Great photos help your item get noticed. Add up to 5 photos to
              showcase your item.
            </p>

            {/* Image Upload Area */}
            <div
              ref={dropAreaRef}
              className={`cursor-pointer flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 border-dashed"
              } rounded-lg transition-colors duration-200 ${
                imageUrls.length + images.length >= 5
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <div className="space-y-2 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-black "
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex flex-col items-center text-sm text-black ">
                  <label
                    htmlFor="images"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    style={{ color: "var(--primary)" }}
                  >
                    <span>Upload images</span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="sr-only"
                      ref={fileInputRef}
                      disabled={imageUrls.length + images.length >= 5}
                    />
                  </label>
                  <p className="pl-1 mt-2">or drag and drop</p>
                </div>
                <p className="text-xs text-black ">
                  PNG, JPG, GIF up to 10MB each (max 5 images)
                </p>
                <div className="mt-2 flex items-center justify-center text-sm text-black ">
                  <span className="font-medium">
                    {imageUrls.length + images.length}
                  </span>
                  <span className="ml-1">of 5 images added</span>
                </div>
              </div>
            </div>

            {/* Image Previews */}
            {(imageUrls.length > 0 || imagePreviewUrls.length > 0) && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-black -700 mb-3">
                  Your Photos:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {/* Existing Images */}
                  {imageUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={`http://localhost:8080${url}`}
                          alt={`Item image ${index + 1}`}
                          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, "existing")}
                        className="absolute top-1 right-1 bg-red-500 text-black  rounded-full p-1 hover:bg-red-600 focus:outline-none shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Remove image"
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-black  text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}

                  {/* New Images */}
                  {imagePreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={url}
                          alt={`New image ${index + 1}`}
                          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, "new")}
                        className="absolute top-1 right-1 bg-red-500 text-black  rounded-full p-1 hover:bg-red-600 focus:outline-none shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Remove image"
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div
                        className="absolute bottom-1 left-1 bg-green-600 bg-opacity-70 text-black  text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: "var(--primary)",
                          opacity: 0.7,
                        }}
                      >
                        New {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-black  mb-4 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: "var(--primary)" }}
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Item Details
            </h3>

            {/* Reserviert Checkbox */}
            <div className="mb-5 flex items-center">
              <input
                id="reserved"
                type="checkbox"
                checked={reserved}
                onChange={(e) => setReserved(e.target.checked)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label
                htmlFor="reserved"
                className="ml-2 block text-sm font-medium text-black"
              >
                Reserviert (Angebot ist reserviert)
              </label>
            </div>

            {/* Item Name */}
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black -700 mb-1"
              >
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black "
                required
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black -700 mb-1"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                placeholder="Describe your item in detail. Include condition, features, and any other relevant information."
                required
              />
              <p className="mt-1 text-sm text-black ">
                A detailed description helps recipients make informed decisions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category */}
              <div className="mb-5">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-black -700 mb-1"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="mb-5">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-black -700 mb-1"
              >
                Location
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-black "
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full pl-10 border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                  placeholder="e.g., Vienna, Austria"
                />
              </div>
              <p className="mt-1 text-sm text-black ">
                Adding a location helps local recipients find your item.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-black  bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              style={{
                backgroundColor: "var(--primary)",
                borderColor: "var(--primary)",
              }}
            >
              {loading || uploadingImages ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black "
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {uploadingImages ? "Uploading Images..." : "Saving..."}
                </>
              ) : (
                <>
                  {editItem ? "Update Item" : "List Item to Give Away"}
                  <svg
                    className="ml-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}
            </button>

            <p className="mt-4 text-sm text-black  text-center">
              By listing an item, you agree to our terms of service and privacy
              policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
