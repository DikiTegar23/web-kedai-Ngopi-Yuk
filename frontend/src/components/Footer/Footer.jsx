import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo_} alt="" />
          <p>
            Warunk Ngopi Yuk! adalah tempat nongkrong kekinian yang menyajikan
            perpaduan unik antara kopi berkualitas, Makanan lezat, dan dessert
            tradisional dibalut cita rasa modern. Sejak berdiri pada tahun 2025,
            kami hadir sebagai ruang nyaman untuk bekerja, berkumpul, dan
            menikmati cita rasa lokal yang dipadukan dengan sentuhan
            internasional.
          </p>
          <div className="footer-social-icons">
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
            <img src={assets.facebook_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About Us</li>
            <li>Delivery</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>+62-878-689-7699</li>
            <li>contact@Ngopi Yuk!.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">Oleh : Kelompok 1.</p>
    </div>
  );
};

export default Footer;
