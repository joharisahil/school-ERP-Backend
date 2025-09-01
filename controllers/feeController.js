import { Fee } from "../models/feeModel.js";

// Create Fee Record
export const createFee = async (req, res) => {
  try {
    const fee = new Fee(req.body);
    await fee.save();
    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Fee Records
export const getFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate("student", "name registrationNumber")
      .populate("class", "grade");
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Fee by ID
export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate("student", "name registrationNumber")
      .populate("class", "grade");
    if (!fee) return res.status(404).json({ message: "Fee record not found" });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Fee Record
// export const updateFee = async (req, res) => {
//   try {
//     const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!fee) return res.status(404).json({ message: "Fee record not found" });
//     res.json(fee);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// Delete Fee Record
// export const deleteFee = async (req, res) => {
//   try {
//     const fee = await Fee.findByIdAndDelete(req.params.id);
//     if (!fee) return res.status(404).json({ message: "Fee record not found" });
//     res.json({ message: "Fee record deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Add Payment (Partial / Full)
// export const payFee = async (req, res) => {
//   try {
//     const { amount, mode, transactionId } = req.body;
//     const fee = await Fee.findById(req.params.id);
//     if (!fee) return res.status(404).json({ message: "Fee record not found" });

//     // Add payment history
//     fee.paymentHistory.push({ amount, mode, transactionId });
//     fee.amountPaid += amount;
//     fee.balanceAmount = fee.totalAmount - fee.amountPaid;

//     // Update status
//     if (fee.amountPaid >= fee.totalAmount) {
//       fee.status = "Paid";
//     } else if (fee.amountPaid > 0) {
//       fee.status = "Partial";
//     } else {
//       fee.status = "Pending";
//     }

//     await fee.save();
//     res.json(fee);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// ✅ Add Extra Fee API
export const addExtraFee = async (req, res) => {
  try {
    const { title, amount } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    // Store extra fee details
    if (!fee.extraFees) fee.extraFees = [];
    fee.extraFees.push({ title, amount });

    // Update totals
    fee.totalAmount += amount;
    fee.balanceAmount = fee.totalAmount - fee.amountPaid;

    // Update status
    if (fee.amountPaid >= fee.totalAmount) {
      fee.status = "Paid";
    } else if (fee.amountPaid > 0) {
      fee.status = "Partial";
    } else {
      fee.status = "Pending";
    }

    await fee.save();
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};