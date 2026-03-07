export const mockReceiptOrder = {
    id: "ORD-20231027-001",
    createdAt: new Date(),
    cashierId: "KASIR-01",
    customerName: "Budi Santoso",
    items: [
        {
            productName: "Kopi Susu Gula Aren",
            qty: 2,
            unitPrice: 25000,
            subtotal: 50000,
        },
        {
            productName: "Roti Bakar Coklat Keju",
            qty: 1,
            unitPrice: 30000,
            subtotal: 30000,
        },
        {
            productName: "Kentang Goreng",
            qty: 1,
            unitPrice: 20000,
            subtotal: 20000,
        }
    ],
    subtotal: 100000,
    discountAmount: 10000,
    shippingFee: 0,
    taxAmount: 9000,
    total: 99000,
    paymentMethod: "tunai",
    cashPaid: 100000,
    changeAmount: 1000,
};

export const mockReceiptStore = {
    name: "Kedai Kopi Senja",
    address: "Jl. Sudirman No. 123, Jakarta Selatan",
    phone: "0812-3456-7890",
    footer: "Terima kasih atas kunjungan Anda!\nSilakan datang kembali.",
    taxName: "PB1",
};
