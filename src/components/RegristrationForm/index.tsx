import { FC, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faEnvelope, faUser, faLock, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import userService, { IUser } from "../../services/user-service";
import avatar from "../../assets/avatar.png";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import './RegistrationForm.css';

export type formData = z.infer<typeof schema>;

const schema = z.object({
  email: z.string().email(),
  userName: z.string().min(3, "Name must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  img: z.optional(z.instanceof(FileList)),
  phoneNumber: z.string().refine((val) => {
    // Check if the phone number is valid using the library's validation
    return isValidPhoneNumber(val) || val === '';
  }, "Please enter a valid phone number")
});

export const RegistrationForm: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState<string>("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<formData>({ resolver: zodResolver(schema) });
  const [watchImg] = watch(["img"]);
  const inputFileRef: { current: HTMLInputElement | null } = { current: null };

  useEffect(() => {
    if (watchImg) {
      setFile(watchImg[0]);
    }
  }, [watchImg]);

  // Update form value when phone number changes
  useEffect(() => {
    setValue('phoneNumber', phoneValue);
  }, [phoneValue, setValue]);

  const onSubmit = async (data: formData) => {
    console.log(data);
    setServerError(null);

    try {
      const res = await userService.uploadImage(file as File);
      console.log(res.data);
      const user: IUser = {
        email: data.email,
        userName: data.userName,
        password: data.password,
        imgURL: res.data.url,
        phoneNumber: data.phoneNumber,
      };

      const registerRes = await userService.register(user);
      console.log(registerRes);
      navigate("/login");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      if (error.response) {
        if (typeof error.response.data === 'string') {
          setServerError(error.response.data);
        } else if (error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else {
          setServerError(`Registration failed (${error.response.status}). Please try again.`);
        }
      } else if (error.message) {
        setServerError(error.message);
      } else {
        setServerError("An error occurred during registration. Please try again.");
      }
    }
  };

  const { ref, ...rest } = register("img");

  return (
    <div className="container mt-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {serverError && (
              <div className="alert alert-danger mb-4" role="alert">
                {serverError}
              </div>
            )}
            
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Registration Form</h2>
                
                <div className="text-center mb-4 position-relative">
                  <img
                    src={file ? URL.createObjectURL(file) : avatar}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="position-absolute bottom-0 end-0" style={{ marginRight: "30%" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-circle"
                      onClick={() => {
                        inputFileRef.current?.click();
                      }}
                    >
                      <FontAwesomeIcon icon={faImage} />
                    </button>
                  </div>
                  <input
                    {...rest}
                    ref={(e) => {
                      ref(e);
                      inputFileRef.current = e;
                    }}
                    id="img"
                    type="file"
                    className="d-none"
                    accept="image/jpeg,image/png"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label d-flex align-items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    id="email"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="userName" className="form-label d-flex align-items-center">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Username
                  </label>
                  <input
                    {...register("userName")}
                    type="text"
                    className={`form-control ${errors.userName ? "is-invalid" : ""}`}
                    id="userName"
                    placeholder="Enter your username"
                  />
                  {errors.userName && (
                    <div className="invalid-feedback">{errors.userName.message}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label d-flex align-items-center">
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Password
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    id="password"
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="phoneNumber" className="form-label d-flex align-items-center">
                    <FontAwesomeIcon icon={faPhone} className="me-2" />
                    Phone Number
                  </label>
                  <div className={errors.phoneNumber ? "is-invalid" : ""}>
                    <PhoneInput
                      international
                      defaultCountry="IL"
                      value={phoneValue}
                      onChange={setPhoneValue}
                      id="phoneNumber"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <div className="invalid-feedback">{errors.phoneNumber.message}</div>
                  )}
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">
                    Register
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center mt-3">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => navigate("/login")}
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};