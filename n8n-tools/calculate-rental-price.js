/**
 * KRASSKI Rental Price Calculator
 * Code Tool для n8n AI Agent
 * 
 * Рассчитывает стоимость проката снаряжения с учётом:
 * - Сезонности (высокий/низкий)
 * - Количества дней
 * - Автоматических скидок (5 человек, 5 дней, 5 позиций, раннее бронирование)
 * - Дополнительных скидок (многодетные, партнёры, самовывоз, инструктор)
 * - Максимальной скидки 20%
 */

// ============================================
// ПРАЙС-ЛИСТ
// ============================================

const PRICING = {
  // Комплекты (лыжи/борд + ботинки + палки)
  komplekt_detskiy: { high: 1300, low: 1100 },
  komplekt_econom: { high: 2000, low: 1500 },
  komplekt_komfort: { high: 3000, low: 2500 },
  komplekt_expert: { high: 4000, low: 3500 },
  
  // Оборудование
  lyzhi_detskie: { high: 800, low: 700 },
  lyzhi_econom: { high: 1000, low: 700 },
  lyzhi_komfort: { high: 2000, low: 1700 },
  lyzhi_expert: { high: 4300, low: 2800 },
  botinki_detskie: { high: 500, low: 400 },
  botinki_vzroslie: { high: 1000, low: 800 },
  palki: { high: 500, low: 400 },
  
  // Защита и одежда
  maska_detskaya: { high: 400, low: 300 },
  maska_vzroslaya: { high: 600, low: 400 },
  shlem_detskiy: { high: 500, low: 400 },
  shlem_vzrosliy: { high: 700, low: 500 },
  kurtka_detskaya: { high: 700, low: 500 },
  kurtka_vzroslaya: { high: 1000, low: 800 },
  kombinezon_detskiy: { high: 1500, low: 1000 },
  kombinezon_vzrosliy: { high: 2000, low: 1600 },
  perchatki_detskie: { high: 400, low: 300 },
  perchatki_vzroslie: { high: 500, low: 400 },
  
  // Прочее
  ryukzak: { high: 700, low: 500 },
  zashita: { high: 700, low: 500 },
  gopro: { high: 3500, low: 3000 },
  kreplenie_snowboard: { high: 1200, low: 1000 }
};

// ============================================
// ФУНКЦИИ РАСЧЁТА
// ============================================

function getSeason(date) {
  if (!date) return 'high';
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  // Высокий сезон: новогодние праздники (1-10 января) + весь февраль
  if ((month === 1 && day <= 10) || month === 2) return 'high';
  return 'low';
}

function calculateBasePrice(items, days, season) {
  let total = 0;
  for (const item of items) {
    const priceData = PRICING[item.type];
    if (!priceData) throw new Error(`Неизвестный тип: ${item.type}`);
    total += priceData[season] * item.quantity * days;
  }
  return total;
}

function countPositions(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateAutoDiscounts(params) {
  const { people, days, positions, daysUntilBooking } = params;
  const discounts = [];
  
  if (people >= 5) discounts.push({ name: '5+ человек', percent: 5 });
  if (days >= 5) discounts.push({ name: '5+ дней проката', percent: 5 });
  if (positions >= 5) discounts.push({ name: '5+ позиций снаряжения', percent: 5 });
  if (daysUntilBooking >= 5) discounts.push({ name: 'Бронирование за 5+ дней', percent: 5 });
  
  return discounts;
}

function calculateExtraDiscounts(params) {
  const { isMultiChild, isPensioner, isBirthday, isPartnerHotel, isSelfPickup, hasInstructor } = params;
  const discounts = [];
  
  if (isMultiChild || isPensioner || isBirthday) {
    const reasons = [];
    if (isMultiChild) reasons.push('многодетная семья');
    if (isPensioner) reasons.push('пенсионер');
    if (isBirthday) reasons.push('именинник');
    discounts.push({ name: reasons.join(', '), percent: 10 });
  }
  
  if (isPartnerHotel) discounts.push({ name: 'Гость отеля-партнёра', percent: 10 });
  if (isSelfPickup) discounts.push({ name: 'Самовывоз', percent: 5 });
  if (hasInstructor) discounts.push({ name: 'Бронирование инструктора', percent: 10 });
  
  return discounts;
}

function applyDiscounts(basePrice, discounts) {
  let totalPercent = discounts.reduce((sum, d) => sum + d.percent, 0);
  const cappedPercent = Math.min(totalPercent, 20);
  const wasCapped = totalPercent > 20;
  const discountAmount = Math.round(basePrice * cappedPercent / 100);
  const finalPrice = basePrice - discountAmount;
  
  return { finalPrice, discountAmount, discountPercent: cappedPercent, appliedDiscounts: discounts, wasCapped };
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================

function calculateRentalPrice(input) {
  try {
    if (!input.items || input.items.length === 0) throw new Error('Не указано снаряжение');
    if (!input.days || input.days < 1) throw new Error('Количество дней должно быть >= 1');
    if (!input.people || input.people < 1) throw new Error('Количество человек должно быть >= 1');
    
    const season = getSeason(input.startDate);
    const basePrice = calculateBasePrice(input.items, input.days, season);
    const positions = countPositions(input.items);
    
    const autoDiscounts = calculateAutoDiscounts({
      people: input.people,
      days: input.days,
      positions: positions,
      daysUntilBooking: input.daysUntilBooking || 0
    });
    
    const extraDiscounts = calculateExtraDiscounts({
      isMultiChild: input.isMultiChild || false,
      isPensioner: input.isPensioner || false,
      isBirthday: input.isBirthday || false,
      isPartnerHotel: input.isPartnerHotel || false,
      isSelfPickup: input.isSelfPickup || false,
      hasInstructor: input.hasInstructor || false
    });
    
    const allDiscounts = [...autoDiscounts, ...extraDiscounts];
    const result = applyDiscounts(basePrice, allDiscounts);
    const hasFreeDelivery = result.finalPrice >= 5000;
    
    return {
      success: true,
      basePrice,
      finalPrice: result.finalPrice,
      discountAmount: result.discountAmount,
      discountPercent: result.discountPercent,
      appliedDiscounts: result.appliedDiscounts,
      wasCapped: result.wasCapped,
      season: season === 'high' ? 'Высокий сезон' : 'Низкий сезон',
      days: input.days,
      people: input.people,
      positions: positions,
      hasFreeDelivery,
      currency: '₽'
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// КОД ДЛЯ N8N
// ============================================

const input = $input.item.json;
const result = calculateRentalPrice(input);
return { json: result };
