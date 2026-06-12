import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaEye, FaImages } from "react-icons/fa";
import "./TaxonomyCarousel.css"; // Nhớ import file CSS mới

export default function TaxonomyCarousel({
  title,
  subtitle,
  data,
  type,
  sort = "createdAt_desc",
}) {
  const entity_list = data || [];
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const handleItemClick = (id) => {
    navigate(`/taxonomy/detail/${id}?rank=${type}`);
  };

  const handleViewAll = () => {
    navigate(`/taxonomy/?display_rank=${type}&sort=${sort}`);
  };

  return (
    <div className="carousel-container">
      <div className="carousel-title-container">
        <div>
          {subtitle && <span className="carousel-subtitle">{subtitle}</span>}
          <h2 className="carousel-title">{title}</h2>
        </div>
        <div className="carousel-view-all" onClick={handleViewAll}>
          Xem tất cả <FaArrowRight className="ms-2" size={14} />
        </div>
      </div>

      {entity_list.length === 0 ? (
        <div className="text-center py-5 text-muted">
          Chưa có dữ liệu để hiển thị.
        </div>
      ) : (
        <Swiper
          modules={[Navigation, Autoplay]}
          slidesPerView={2}
          spaceBetween={24}
          navigation
          loop={entity_list.length > 4} // Chỉ loop nếu có nhiều hơn 4 item
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="taxonomy-swiper"
        >
          {entity_list.slice(0, 10).map((item) => {
            const imageUrl = item?.thumbnail?.url
              ? item.thumbnail.is_external
                ? item.thumbnail.url
                : `${apiUrl}${item.thumbnail.url}`
              : "default-plant.png";

            return (
              <SwiperSlide key={item.id}>
                <div
                  className="carousel-image-wrapper"
                  onClick={() => handleItemClick(item.id)}
                >
                  <img
                    src={imageUrl}
                    alt={item.common_name}
                    className="carousel-image"
                  />
                  <div className="carousel-overlay"></div>

                  <div className="carousel-caption-custom">
                    <p className="caption-subtitle">{item.common_name}</p>

                    <h5 className="caption-title">
                      {item.canonical_name || item.scientific_name}
                    </h5>
                    <p className="caption-subtitle">
                      {item.canonical_name ? item.scientific_name : ""}
                    </p>

                    <div className="caption-badges">
                      <span className="caption-badge">
                        <FaEye className="me-1" /> {item.view_count || 0}
                      </span>

                      <span className="caption-badge">
                        <FaImages className="me-1" /> {item.image_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </div>
  );
}
