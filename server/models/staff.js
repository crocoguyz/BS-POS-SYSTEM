import React, { useState } from 'react'; // React နဲ့အတူ useState ပါရမယ်
import axios from 'axios';               // အသစ်သွင်းထားတဲ့ axios ကို ခေါ်သုံးမယ်
// Staff အတွက် Schema (Data Structure) ဆောက်တာ

const StaffManagement = () => {
    // 1. Input Box တွေအတွက် State ဆောက်မယ်
    const [staffName, setStaffName] = useState("");
    const [role, setRole] = useState("Waiter"); // default value ပေးထားတာ

    // 2. Bro မေးတဲ့ Function ကို ဒီထဲမှာ ထည့်မယ်
    const handleSaveStaff = async () => {
        if (!staffName) return alert("နာမည် ထည့်ပါဦး Bro!");

        const staffData = {
            name: staffName,
            role: role
        };

        try {
            const response = await axios.post('http://localhost:5000/api/staff', staffData);
            if(response.status === 201) {
                alert("Staff saved to Database! 🎉");
                setStaffName(""); // သိမ်းပြီးရင် စာသား ပြန်ဖျက်မယ်
                // ဒီမှာ Modal ပိတ်တဲ့ code ထည့်ပါ
            }
        } catch (error) {
            console.error("Error:", error);
            alert("DB ချိတ်မရဘူး ဖြစ်နေတယ်!");
        }
    };

    return (
        // Bro ရဲ့ HTML/UI code တွေ ဒီအောက်မှာ ရှိမယ်
        // Input box မှာ onChange={(e) => setStaffName(e.target.value)} ဆိုတာ ပါရမယ်
        // Save ခလုတ်မှာ onClick={handleSaveStaff} ဆိုတာ ထည့်ပေးရမယ်
    );
};