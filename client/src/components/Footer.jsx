import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        bottom: 0,
        width: "100%",
        color: "#fff",
        marginTop: "5rem",
        padding: "10px 0",
      }}
    >
      <p>&copy; {new Date().getFullYear()} Amit Rana. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
