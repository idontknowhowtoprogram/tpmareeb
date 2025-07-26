// Helper: set value and highlight if it's valid
function setFieldValue(id, val) {
  const el = document.getElementById(id);
  const isValid = val && val.toUpperCase() !== "N/A";
  el.value = isValid ? val : "";
  el.style.backgroundColor = isValid ? "#d0e8ff" : "";

  if (!el.dataset.listener) {
    el.addEventListener("input", () => {
      el.style.backgroundColor = "";
      el.setCustomValidity("");
    });
    el.dataset.listener = "true";
  }
}

// Validate the vehicle year input
function validateYear() {
  const yearInput = document.getElementById("year");
  const year = yearInput.value.trim();
  const currentYear = new Date().getFullYear();
  const minYear = 1980;
  const maxYear = currentYear + 1;

  if (!/^\d{4}$/.test(year)) {
    yearInput.setCustomValidity("Please enter a valid 4-digit year.");
    yearInput.reportValidity();
    return false;
  }

  const yearNum = parseInt(year, 10);
  if (yearNum < minYear || yearNum > maxYear) {
    yearInput.setCustomValidity(
      `Year must be between ${minYear} and ${maxYear}.`
    );
    yearInput.reportValidity();
    return false;
  }

  yearInput.setCustomValidity(""); // Clear errors
  return true;
}

// Map numeric cylinder count to dropdown option format (e.g. 4 -> I4)
function mapCylinders(num) {
  if (!num) return "";
  const n = parseInt(num, 10);
  if (isNaN(n)) return "";
  if (n === 3) return "I3";
  if (n === 4) return "I4";
  if (n === 6) return "V6";
  if (n === 8) return "V8";
  if (n === 10) return "V10";
  if (n === 12) return "V12";
  return ""; // fallback empty if no match
}

async function decodeVin() {
  const vinInput = document.getElementById("vin").value.trim();
  const resultDiv = document.getElementById("result");

  if (vinInput.length !== 17) {
    resultDiv.innerText = "VIN must be exactly 17 characters.";
    return;
  }

  resultDiv.innerText = "Decoding VIN, please wait...";

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vinInput}?format=json`
    );
    const data = await response.json();

    let details = {};
    data.Results.forEach((item) => {
      if (item.Variable === "Make") details.make = item.Value;
      if (item.Variable === "Model") details.model = item.Value;
      if (item.Variable === "Model Year") details.year = item.Value;
      if (item.Variable === "Body Class") details.bodyClass = item.Value;
      if (item.Variable === "Engine Model") details.engineModel = item.Value;
      if (item.Variable === "Engine Displacement (L)")
        details.engineSize = item.Value;
      if (item.Variable === "Engine Cylinders") details.cylinders = item.Value;
      if (item.Variable === "Fuel Type - Primary")
        details.fuelType = item.Value;
      if (item.Variable === "Transmission Style")
        details.transmission = item.Value;
      if (item.Variable === "Plant Country") details.plantCountry = item.Value;
    });

    if (!details.make || !details.model || !details.year) {
      resultDiv.innerText =
        "Could not decode VIN properly. Please check the number.";
      return;
    }

    // Year validation for decoded year only
    if (details.year) {
      const yearNum = parseInt(details.year, 10);
      const currentYear = new Date().getFullYear();
      if (
        isNaN(yearNum) ||
        yearNum < 1980 ||
        yearNum > currentYear + 1 ||
        details.year.length !== 4
      ) {
        resultDiv.innerText = `Decoded year (${details.year}) seems invalid.`;
        return;
      }
    }

    setFieldValue("year", details.year);
    setFieldValue("modelName", details.model);
    setFieldValue("bodyClass", details.bodyClass);
    setFieldValue("cylinders", mapCylinders(details.cylinders));
    setFieldValue("fuelType", details.fuelType);
    setFieldValue("transmission", details.transmission);
    setFieldValue("plantCountry", details.plantCountry);

    resultDiv.innerText =
      `Vehicle: ${details.year || ""} ${details.make || ""} ${
        details.model || ""
      }\n` +
      `Body: ${details.bodyClass || ""}\n` +
      `Engine: ${details.engineSize || ""} ${details.engineModel || ""}\n` +
      `Fuel: ${details.fuelType || ""}\n` +
      `Transmission: ${details.transmission || ""}\n` +
      `Manufactured in: ${details.plantCountry || ""}`;

    // Update car dropdown
    const carSelect = document.getElementById("car");
    let optionExists = false;
    for (let opt of carSelect.options) {
      if (opt.text.toLowerCase() === details.make?.toLowerCase()) {
        carSelect.value = opt.value;
        optionExists = true;
        break;
      }
    }
    if (!optionExists && details.make) {
      const newOption = document.createElement("option");
      newOption.value = details.make.toLowerCase();
      newOption.text = details.make;
      newOption.selected = true;
      carSelect.add(newOption);
    }
  } catch (error) {
    resultDiv.innerText = "Error decoding VIN. Please try again.";
    console.error(error);
  }
}

const prices = {
  oil: 100,
  ac: 150,
  brake: 120,
};

const times = {
  oil: 30,
  ac: 45,
  brake: 40,
};

function calculateEstimate() {
  if (!validateYear()) {
    // Stop calculation if year invalid
    return;
  }

  const checkboxes = document.querySelectorAll(
    '#services input[type="checkbox"]:checked'
  );
  if (checkboxes.length === 0) {
    document.getElementById("result").innerText =
      "Please select at least one service.";
    document.getElementById("whatsappBtn").classList.add("hidden");
    return;
  }

  let totalCost = 0;
  let totalTime = 0;

  checkboxes.forEach((cb) => {
    totalCost += prices[cb.value];
    totalTime += times[cb.value];
  });

  const carMake = document.getElementById("car").value || "your vehicle";
  const year = document.getElementById("year").value || "";
  const modelName = document.getElementById("modelName").value || "";

  const message =
    `Estimate for your ${year} ${
      carMake.charAt(0).toUpperCase() + carMake.slice(1)
    } ${modelName}:\n` +
    `Services: ${Array.from(checkboxes)
      .map((cb) => cb.parentElement.textContent.trim())
      .join(", ")}\n` +
    `Total Cost: AED ${totalCost}\n` +
    `Estimated Time: ~${totalTime} mins`;

  document.getElementById("result").innerText = message;
  const whatsappBtn = document.getElementById("whatsappBtn");
  whatsappBtn.classList.remove("hidden");
  whatsappBtn.dataset.message = encodeURIComponent(message);
}

function resetForm() {
  document.getElementById("car").selectedIndex = 0;
  document
    .querySelectorAll('#services input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  const fieldIds = [
    "year",
    "modelName",
    "bodyClass",
    "cylinders",
    "fuelType",
    "transmission",
    "plantCountry",
  ];
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    el.value = "";
    el.style.backgroundColor = "";
    el.setCustomValidity("");
  });

  document.getElementById("result").innerText = "";
  document.getElementById("whatsappBtn").classList.add("hidden");
}

// Clear result & WhatsApp button when VIN input changes
document.getElementById("vin").addEventListener("input", () => {
  document.getElementById("result").innerText = "";
  document.getElementById("whatsappBtn").classList.add("hidden");
});
