// AxiosInterceptor.jsx
import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import {setUser} from    "../redux/authSlice"          

function AxiosInterceptor({ children }) {
//   const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // User ko null set kar do -> logout
          dispatch(setUser(null));

          // redirect to login
          window.location.href = "http://localhost:5173/";
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [dispatch]);

  return children;
}

export default AxiosInterceptor;
