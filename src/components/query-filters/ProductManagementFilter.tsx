import {Col, Flex, Row, Slider} from 'antd';
import React from 'react';


interface ProductManagementFilterProps {
  query: {name: string; category: string; brand: string; limit: number};
  setQuery: React.Dispatch<
    React.SetStateAction<{name: string; category: string; brand: string; limit: number}>
  >;
}

const ProductManagementFilter = ({query, setQuery}: ProductManagementFilterProps) => {

  return (
    <Flex
      style={{
        border: '1px solid grey',
        padding: '1rem',
        marginBottom: '.5rem',
        borderRadius: '1rem',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.4) inset',
      }}
    >
      <Row gutter={2} style={{width: '100%'}}>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Price Range</label>
          <Slider
            range
            step={100}
            max={20000}
            defaultValue={[1000, 5000]}
            onChange={(value) => {
              setQuery((prev) => ({
                ...prev,
                minPrice: value[0],
                maxPrice: value[1],
              }));
            }}
          />
        </Col>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Search by product name</label>
          <input
            type='text'
            value={query.name}
            className={`input-field`}
            placeholder='Search by Product Name'
            onChange={(e) => setQuery((prev) => ({...prev, name: e.target.value}))}
          />
        </Col>
      </Row>
    </Flex>
  );
};

export default ProductManagementFilter;
