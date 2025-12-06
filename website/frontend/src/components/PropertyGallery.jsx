import { useState } from 'react'
import getPropertyImage from '../utils/propertyImages'
import './PropertyDetails.css'

function PropertyGallery({ images = [], propertyType }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const galleryImages = images.length > 0 ? images : [getPropertyImage(propertyType)]
  const primaryImage = galleryImages[0]
  const secondaryImages = galleryImages.slice(1, 5)

  const openModalAt = (index) => {
    setActiveIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  return (
    <div className="gallery-wrapper">
      <div className="gallery-grid">
        <div className="gallery-main" onClick={() => openModalAt(0)}>
          <img src={primaryImage} alt="Primary view" />
        </div>
        <div className="gallery-secondary">
          {secondaryImages.map((img, idx) => (
            <div
              key={img}
              className="gallery-secondary-image"
              onClick={() => openModalAt(idx + 1)}
            >
              <img src={img} alt={`Gallery ${idx + 2}`} />
            </div>
          ))}
          {galleryImages.length > 1 && galleryImages.length < 5 &&
            Array.from({ length: 4 - secondaryImages.length }).map((_, idx) => (
              <div key={`placeholder-${idx}`} className="gallery-secondary-image placeholder" />
            ))}
        </div>
        <button className="view-all-button" type="button" onClick={() => openModalAt(0)}>
          View all photos
        </button>
      </div>

      {isModalOpen && (
        <div className="gallery-modal" role="dialog" aria-modal="true">
          <div className="gallery-modal-backdrop" onClick={closeModal} />
          <div className="gallery-modal-content">
            <button className="modal-close" type="button" onClick={closeModal}>
              ×
            </button>
            <div className="modal-image-frame">
              <button className="modal-nav prev" type="button" onClick={handlePrev}>
                ‹
              </button>
              <img src={galleryImages[activeIndex]} alt={`Gallery ${activeIndex + 1}`} />
              <button className="modal-nav next" type="button" onClick={handleNext}>
                ›
              </button>
            </div>
            <div className="modal-thumbs">
              {galleryImages.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  className={`thumb ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyGallery
