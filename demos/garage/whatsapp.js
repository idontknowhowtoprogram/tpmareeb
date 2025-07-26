// whatsapp.js

function sendWhatsApp() {
  const message = document.getElementById("whatsappBtn").dataset.message;
  const phone = "971526286737"; // your business phone number with country code
  if (!phone) {
    alert("Please set your WhatsApp phone number in the script.");
    return;
  }
  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, "_blank");
}
