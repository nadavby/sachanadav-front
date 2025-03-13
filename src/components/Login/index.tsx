/** @format */

import { FC } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import userService from "../../services/user-service";

type FormData = {
  email: string;
  password: string;
};

export const Login: FC = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    try {
      const request = userService.login(data.email, data.password);
      const response = await request;

      if (response.accessToken && response.refreshToken) {
        console.log("Login success :", response);

        navigate("/posts");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        style={{
          width: "100vw",
          display: "flex",
          backgroundColor: "white",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <div
          className="d-flex flex-column "
          style={{
            width: "60%",
            backgroundColor: "lightblue",
            padding: "20px",
            borderRadius: "10px",
          }}>
          <h1 style={{ display: "flex", justifyContent: "center" }}>Login</h1>
          <label>Email:</label>

          <input
            type="email"
            className="mb-3"
            {...register("email")}
            required
          />

          <label>password:</label>
          <input
            type="password"
            className="mb-3"
            {...register("password")}
            required
          />

          <button type="submit">Login</button>
          <p style={{ textAlign: "center" }}>
            <Link to="/register">Registration Form</Link>
          </p>
        </div>
      </div>
    </form>
  );
};
