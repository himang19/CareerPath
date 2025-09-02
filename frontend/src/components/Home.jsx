import React, { useEffect } from "react";
import Navbar from "./shared/Navbar";
import HeroSection from "./HeroSection";
import CategoryCarousel from "./CategoryCarousel";
import LatestJobs from "./LatestJobs";
import Footer from "./shared/Footer";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {USER_API_END_POINT} from "../utils/constant"
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";
const Home = () => {

  console.log("insidne home");
  useGetAllJobs();
  const dispatch=useDispatch();
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
   useEffect(() => {
    const fetchUser = async () => {
      try {

        console.log("fetchin gtsat");
        const res = await axios.get(`${USER_API_END_POINT}/getuser`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setUser(res.data.user)); 
        }
      } catch (error) {
        console.log("No active session", error);
      }
    };
      const urlParams = new URLSearchParams(window.location.search);
    if (!user && urlParams.get('error') !== 'role_mismatch') {
      fetchUser();
    }
  }, []);
  useEffect(() => {
    if (user?.role === "recruiter") {
      console.log("itss a twwooooooooooo");
      navigate("/admin/companies");
    }
  }, [user]);

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'role_mismatch') {
   setTimeout(() => {
      toast.error("No profile exists with such role");
    }, 100);
    // Clean the URL
    // window.history.replaceState({}, '', window.location.pathname);
  }
}, []);

  console.log("uefhdddddddddddddddddd",user);
  return (
    <div>
      <Navbar />
      <HeroSection />
      <CategoryCarousel />
      <LatestJobs />
      <Footer />
    </div>
  );
};

export default Home;
