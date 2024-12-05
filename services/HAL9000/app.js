const express = require('express');
const connectDB = require('./shared/db/db.js');
const AiRoutes = require('./routes/index.js')
const errorHandler = require('./shared/middleware/errorHandler.js')
require('./shared/middleware/logRequest.js')
require('./shared/utils/circuitBreaker.js')
require('dotenv').config();
const app = express();
const cors = require('cors');
app.use(express.json());
const corsOptions = {
    origin: "*",  // Cho phép mọi nguồn (cổng khác nhau)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header cho phép
};
app.use(cors(corsOptions));
app.use('/', AiRoutes);
app.use(errorHandler)

// Hàm xử lý dữ liệu đầu vào, chỉ lấy các key cần thiết
const processInputData = (inputData, allowedKeys) => {
    const criteria = {};

    // Ánh xạ các key từ dữ liệu đầu vào sang key sử dụng trong query
    const fieldMappings = {
        "ADDRESS:ADDRESS": "address",
        "AGE:AGE": "age",
        "HOBBY:HOBBY": "hobby",
        "NAME:NAME": "name",
        "Province:Province": "province",
        "SCHOOL:SCHOOL": "school",
        "WORKPLACE:WORKPLACE": "workplace"
    };

    // Duyệt qua tất cả các key trong inputData
    for (const key in inputData) {
        // Kiểm tra key có trong allowedKeys và fieldMappings
        if (allowedKeys.includes(fieldMappings[key]) && inputData[key]) {
            criteria[fieldMappings[key]] = inputData[key]; // Thêm vào criteria nếu key hợp lệ và có giá trị
        }
    }

    return criteria;
};

// Hàm xử lý tìm kiếm người dùng, chỉ lấy các key cần thiết từ inputData
const processInputFindUser = (inputData) => {
    const criteria = {};

    // Các key cần lọc
    const allowedKeys = ['age', 'name', 'workplace', 'hobby'];

    // Ánh xạ các key từ dữ liệu đầu vào sang key sử dụng trong query
    const fieldMappings = {
        "ADDRESS:ADDRESS": "address",
        "AGE:AGE": "age",
        "HOBBY:HOBBY": "hobby",
        "NAME:NAME": "name",
        "Province:Province": "province",
        "SCHOOL:SCHOOL": "school",
        "WORKPLACE:WORKPLACE": "workplace"
    };

    // Duyệt qua tất cả các key trong inputData
    for (const key in inputData) {
        // Kiểm tra key có trong allowedKeys và fieldMappings
        if (allowedKeys.includes(fieldMappings[key]) && inputData[key]) {
            criteria[fieldMappings[key]] = inputData[key]; // Thêm vào criteria nếu key hợp lệ và có giá trị
        }
    }

    return criteria;
};

const PORT = process.env.BOT_PORT || 4000;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});