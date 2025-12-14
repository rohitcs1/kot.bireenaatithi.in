function calcTaxesAndTotal(items = [], { gstPercent = 0, serviceChargePercent = 0, discount = 0 } = {}) {
  const subtotal = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  const gst = +(subtotal * (gstPercent / 100));
  const service_charge = +(subtotal * (serviceChargePercent / 100));
  const totalBeforeDiscount = subtotal + gst + service_charge;
  const total = +(totalBeforeDiscount - Number(discount || 0));
  return { subtotal, gst, service_charge, discount: Number(discount || 0), total };
}

module.exports = { calcTaxesAndTotal };
