/** @format */

import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import userService from "../../services/user-service";

type FormData = {
  email: string;
  password: string;
};

export const Login: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const [serverError, setServerError] = useState("");
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
      setServerError("Incorrect email or password.");
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
          <img
            src="/favicon.jpg"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "20px",
              display: "flex",
            }}
          />
          <h1 style={{ display: "flex", justifyContent: "center" }}>
            Boarding-pass
          </h1>

          <label>email:</label>

          <input
            type="email"
            className="mb-3"
            {...register("email")}
            required
            style={{ borderRadius: "5px", border: "1px" }}
          />
          {errors.email && (
            <p className="text-danger">{errors.email.message}</p>
          )}

          <label>password:</label>
          <input
            type="password"
            className="mb-3"
            {...register("password")}
            required
            style={{ borderRadius: "5px", border: "1px" }}
          />
          {errors.password && (
            <p className="text-danger">{errors.password.message}</p>
          )}
          {serverError && <p className="text-danger">{serverError}</p>}

          <button
            type="submit"
            className="btn btn-outline-primary">
            Login
          </button>
          <p style={{ textAlign: "center" }}>
            <Link to="/register">Registration Form</Link>
          </p>
        </div>
      </div>
    </form>
  );
};
