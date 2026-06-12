// import React, { useMemo, useEffect } from "react";
// import Select, { components } from "react-select";

// // 1. TẠO CUSTOM MENU LIST ĐỂ CĂN GIỮA THANH CUỘN
// const CustomMenuList = (props) => {
//   const { innerRef, children } = props;

//   useEffect(() => {
//     // Tăng thời gian chờ lên 50ms để "đi sau, về trước",
//     // đảm bảo React-Select đã cuộn mặc định xong thì ta mới can thiệp đè lên.
//     const timer = setTimeout(() => {
//       if (innerRef.current) {
//         // Tìm chính xác Option đang được chọn thông qua class
//         const selectedEl = innerRef.current.querySelector('.rs__option--is-selected');

//         if (selectedEl) {
//           // Bỏ phép toán thủ công. Dùng API native của trình duyệt.
//           // block: 'center' sẽ ép phần tử này nằm chính giữa vùng nhìn thấy!
//           selectedEl.scrollIntoView({ behavior: 'instant', block: 'center' });
//         }
//       }
//     }, 50);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <components.MenuList {...props}>
//       {children}
//     </components.MenuList>
//   );
// };

// const SmartSelect = ({
//   options = [],
//   value,
//   onChange,
//   onBlur,
//   placeholder,
//   label = "mục",
//   isDisabled,
//   isNewable = true,
//   isNullable = false,
// }) => {

//   const finalOptions = useMemo(() => {
//     const newOption = isNewable ? { value: "new", label: `+ Thêm ${label} mới...`, isNew: true } : null;
//     const defaultOption = isNullable ? { value: null, label: `Chọn ${label}...`, isNew: false } : null;

//     let arr = [];
//     if (!options?.length) {
//       arr = isNewable ? [newOption] : isNullable ? [defaultOption] : [];
//     } else if (options.length <= 6) {
//       arr = isNewable ? [...options, newOption] : isNullable ? [defaultOption, ...options] : [...options];
//     } else {
//       arr = isNewable ? [newOption, ...options] : isNullable ? [defaultOption, ...options] : [...options];
//     }

//     return arr.filter(Boolean);
//   }, [options, label, isNewable, isNullable]);

//   const currentValue = useMemo(() => {
//     if (!value) return isNullable ? finalOptions.find(o => o.value === null) : null;
//     return finalOptions.find(opt => opt?.value === value?.value) || value;
//   }, [value, finalOptions, isNullable]);

//   const customStyles = {
//     control: (base, state) => ({
//       ...base,
//       borderColor: state.isFocused ? "#198754" : "#ced4da",
//       boxShadow: state.isFocused ? "0 0 0 0.25rem rgba(25, 135, 84, 0.25)" : "none",
//       "&:hover": { borderColor: "#198754" }
//     }),
//     menu: (base) => ({
//         ...base,
//         zIndex: 9999
//     }),
//     option: (base, { data, isFocused, isSelected }) => {
//       if (data.isNew) {
//         return {
//           ...base,
//           fontWeight: "bold",
//           color: (isSelected || isFocused) ? "#ffffff" : "#0d6efd",
//           backgroundColor: isSelected ? "#198754" : isFocused ? "#0d6efd" : "#e7f1ff",
//           borderTop: "1px dashed #b6d4fe"
//         };
//       }
//       if (isSelected) {
//         return {
//           ...base,
//           backgroundColor: "#198754",
//           color: "white",
//           fontWeight: "600"
//         };
//       }
//       if (isFocused) {
//         return {
//           ...base,
//           backgroundColor: "#e9ecef",
//           color: "#212529"
//         };
//       }
//       return {
//         ...base,
//         backgroundColor: "white",
//         color: "#212529"
//       };
//     }
//   };

//   return (
//     <Select
//       // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ BẮT CLASS Ở TRÊN
//       classNamePrefix="rs"

//       options={finalOptions}
//       value={currentValue}
//       onChange={onChange}
//       onBlur={onBlur}

//       components={{ MenuList: CustomMenuList }}

//       styles={customStyles}
//       placeholder={isDisabled ? "" : placeholder}
//       isDisabled={isDisabled}
//       isSearchable
//       noOptionsMessage={() => "Không tìm thấy dữ liệu"}
//     />
//   );
// };

import React, { useMemo, useState, useEffect } from "react";
import Select, { components } from "react-select";

// 1. MENU LIST SIÊU NHẸ - CHỈ KÍCH HOẠT LOAD MORE KHI CẦN
const CustomMenuList = (props) => {
  const { children, innerProps, selectProps } = props;

  // Tự động nạp thêm dữ liệu khi dùng phím mũi tên đến gần cuối danh sách hiển thị
  useEffect(() => {
    if (children && Array.isArray(children)) {
      const focusedIndex = children.findIndex(
        (child) => child.props?.isFocused,
      );
      if (focusedIndex >= children.length - 10 && selectProps.onLoadMore) {
        selectProps.onLoadMore();
      }
    }
  }, [children, selectProps]);

  // Kích hoạt nạp thêm dữ liệu khi cuộn chuột thủ công gần tới đáy
  const handleScroll = (e) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
      if (selectProps.onLoadMore) {
        selectProps.onLoadMore();
      }
    }
    if (innerProps && typeof innerProps.onScroll === "function") {
      innerProps.onScroll(e);
    }
  };

  return (
    <components.MenuList
      {...props}
      innerProps={{ ...innerProps, onScroll: handleScroll }}
    >
      {children}
    </components.MenuList>
  );
};

const SmartSelect = ({
  options = [],
  value,
  onChange,
  onBlur,
  placeholder,
  label = "mục",
  isDisabled,
  isNewable = true,
  isNullable = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(60); // Mức hiển thị cơ sở ban đầu

  // Khởi tạo toàn bộ danh sách Option cấu hình chuẩn (+ Thêm mới, Chọn...)
  const finalOptions = useMemo(() => {
    const newOption = isNewable
      ? { value: "new", label: `+ Thêm ${label} mới...`, isNew: true }
      : null;
    const defaultOption = isNullable
      ? { value: null, label: `Chọn ${label}...`, isNew: false }
      : null;

    let arr = [];
    if (!options?.length) {
      arr = isNewable ? [newOption] : isNullable ? [defaultOption] : [];
    } else if (options.length <= 6) {
      arr = isNewable
        ? [...options, newOption]
        : isNullable
          ? [defaultOption, ...options]
          : [...options];
    } else {
      arr = isNewable
        ? [newOption, ...options]
        : isNullable
          ? [defaultOption, ...options]
          : [...options];
    }

    return arr.filter(Boolean);
  }, [options, label, isNewable, isNullable]);

  const currentValue = useMemo(() => {
    if (!value)
      return isNullable ? finalOptions.find((o) => o.value === null) : null;
    return finalOptions.find((opt) => opt?.value === value?.value) || value;
  }, [value, finalOptions, isNullable]);

  // CHỐNG LAG CỐT LÕI: Tự động lọc dữ liệu thô (Options Level) bằng JS thuần cực nhanh trước khi đưa vào React-Select
  const filteredOptions = useMemo(() => {
    if (!inputValue) return finalOptions;
    const searchStr = inputValue.toLowerCase();
    return finalOptions.filter(
      (opt) =>
        opt.label?.toLowerCase().includes(searchStr) ||
        opt.value?.toString().toLowerCase().includes(searchStr),
    );
  }, [finalOptions, inputValue]);

  // Tìm index của mục đang chọn để ưu tiên hiển thị ngay lập tức khi mở lại menu
  const selectedIndex = useMemo(() => {
    if (!currentValue) return -1;
    return filteredOptions.findIndex((opt) => opt.value === currentValue.value);
  }, [filteredOptions, currentValue]);

  // Giới hạn biên tính toán tối đa chuyển giao cho React-Select xử lý DOM
  const sliceEnd = useMemo(() => {
    return Math.max(visibleCount, selectedIndex + 15);
  }, [visibleCount, selectedIndex]);

  const slicedOptions = useMemo(() => {
    return filteredOptions.slice(0, sliceEnd);
  }, [filteredOptions, sliceEnd]);

  // Callback tăng kích thước danh sách khi cuộn/di chuyển phím đến biên đáy
  const handleLoadMore = () => {
    if (visibleCount < filteredOptions.length) {
      setVisibleCount((prev) => prev + 50);
    }
  };

  const handleInputChange = (value, actionMeta) => {
    if (actionMeta.action === "input-change") {
      setInputValue(value);
      setVisibleCount(60); // Reset kích thước hiển thị khi người dùng gõ từ khóa tìm kiếm mới
    }
  };

  const handleMenuClose = () => {
    setInputValue("");
    setVisibleCount(60); // Giải phóng hoàn toàn bộ nhớ đệm khi đóng hộp chọn
  };

  const customStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#198754" : "#ced4da",
        boxShadow: state.isFocused
          ? "0 0 0 0.25rem rgba(25, 135, 84, 0.25)"
          : "none",
        "&:hover": { borderColor: "#198754" },
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      option: (base, { data, isFocused, isSelected }) => {
        if (data.isNew) {
          return {
            ...base,
            fontWeight: "bold",
            color: isSelected || isFocused ? "#ffffff" : "#0d6efd",
            backgroundColor: isSelected
              ? "#198754"
              : isFocused
                ? "#0d6efd"
                : "#e7f1ff",
            borderTop: "1px dashed #b6d4fe",
          };
        }
        if (isSelected) {
          return {
            ...base,
            backgroundColor: "#198754",
            color: "white",
            fontWeight: "600",
          };
        }
        if (isFocused) {
          return {
            ...base,
            backgroundColor: "#e9ecef",
            color: "#212529",
          };
        }
        return {
          ...base,
          backgroundColor: "white",
          color: "#212529",
        };
      },
    }),
    [],
  );

  return (
    <Select
      classNamePrefix="rs"
      options={slicedOptions} // Chỉ truyền mảng đã được cắt nhỏ tối ưu
      value={currentValue}
      onChange={onChange}
      onBlur={onBlur}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onMenuClose={handleMenuClose}
      filterOption={() => true} // TẮT BỘ LỌC MẶC ĐỊNH CỦA LIBRARY để tránh lặp chu kỳ quét mảng 10K dòng
      components={{ MenuList: CustomMenuList }}
      onLoadMore={handleLoadMore} // Khai báo prop tùy biến để MenuList nhận dạng thông qua selectProps
      styles={customStyles}
      placeholder={isDisabled ? "" : placeholder}
      isDisabled={isDisabled}
      isSearchable
      noOptionsMessage={() => "Không tìm thấy dữ liệu"}
    />
  );
};

export default SmartSelect;
