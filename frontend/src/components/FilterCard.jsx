import React, { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";

const FilterCard = () => {
  const { allJobs } = useSelector((store) => store.job); // Redux state
  const [selectedValue, setSelectedValue] = useState(""); // Local state for the selected filter
  const [locations, setLocations] = useState([]); // Local state for locations
  const [industries, setIndustries] = useState([]); // Local state for industries
  const dispatch = useDispatch();

  // Predefined values for location and industries
  const predefinedLocations = [
    "Mumbai", "Delhi", "Gurgaon", "Bangalore", "Pune"
  ];

  const predefinedIndustries = [
    "Backend Developer", "Frontend Developer", "Full Stack Developer", 
    "Machine Learning", "Graphic Designer"
  ];

  // Function to handle case-insensitive addition without duplicates
  const addUnique = (existingArray, newValues) => {
    const existingSet = new Set(existingArray.map(item => item.toLowerCase())); // Convert to lowercase to ensure case-insensitivity
    return [
      ...existingArray,
      ...newValues.filter(item => !existingSet.has(item.toLowerCase())) // Add only if it's not already present
    ];
  };

  // Calculate locations and industries whenever `allJobs` changes
  useEffect(() => {
    const allLocations = allJobs.map((job) => job.location);
    const allIndustries = allJobs.map((job) => job.title);

    const updatedLocations = addUnique(predefinedLocations, allLocations);
    const updatedIndustries = addUnique(predefinedIndustries, allIndustries);

    setLocations(updatedLocations);
    setIndustries(updatedIndustries);
  }, [allJobs]); // Dependency on `allJobs`

  const filterData = [
    {
      filterType: "Job Locations",
      array: locations,
    },
    {
      filterType: "Industry",
      array: industries,
    },
    {
      filterType: "Salary",
      array: ["0-40k", "40k-1 lakh", "1 lakh-5 lakh", "Above 5 lakh"],
    },
  ];

  const changeHandler = (value) => {
    setSelectedValue(value);
    dispatch(setSearchedQuery(value)); // Update Redux state
  };

  const clearFilters = () => {
    setSelectedValue("");
    dispatch(setSearchedQuery("")); // Clear Redux state
  };

  // Clear filters when the component mounts
  useEffect(() => {
    clearFilters();
  }, []);

  return (
    <div className="w-full bg-white p-3 rounded-md">
      <h1 className="font-bold text-lg">Filter Jobs</h1>
      <hr className="mt-3" />
      <RadioGroup value={selectedValue} onValueChange={changeHandler}>
        {filterData.map((data, index) => (
          <div key={index}>
            <h1 className="font-bold text-lg">{data.filterType}</h1>
            {data.array.map((item, idx) => {
              const itemId = `id${index}-${idx}`;
              return (
                <div className="flex items-center space-x-2 my-2" key={itemId}>
                  <RadioGroupItem value={item} id={itemId} />
                  <Label htmlFor={itemId}>{item}</Label>
                </div>
              );
            })}
          </div>
        ))}
      </RadioGroup>
      <button
        onClick={clearFilters}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterCard;
