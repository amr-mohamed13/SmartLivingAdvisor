// Utility function to get property image based on property_type
import apartmentImg from '../assets/apartment.png'
import villaImg from '../assets/villa.png'
import condoImg from '../assets/condo.png'
import farmhouseImg from '../assets/farmhouse.png'
import penthouseImg from '../assets/penthouse.png'
import bungalowImg from '../assets/bungalow.png'

const propertyImageMap = {
  'Apartment': apartmentImg,
  'Villa': villaImg,
  'Condo': condoImg,
  'Farmhouse': farmhouseImg,
  'Penthouse': penthouseImg,
  'Bungalow': bungalowImg,
}

export const getPropertyImage = (propertyType) => {
  if (!propertyType) return apartmentImg
  const normalizedType = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
  return propertyImageMap[normalizedType] || apartmentImg
}

export default getPropertyImage



