import styled from 'styled-components';

// header

export const Header = styled.section`
  text-align: center;
  padding: 4rem 0 8rem 0;
  color: #f2f2f2;
  margin-bottom: 2rem;

  @media screen and (max-width: 768px) {
    padding: 4rem 0 2rem 0;
  }
`;

export const PageTitle = styled.h1`
  font-weight: 500;
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 5.5rem;
  letter-spacing: -0.02rem;

  @media screen and (max-width: 768px) {
    font-size: 2.5rem;
    line-height: 3.5rem;
  }
`;

export const PageSubtitle = styled.h2`
  font-size: 2rem;
  font-weight: 400;

  @media screen and (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const Posts = styled.article`
  margin: 0 auto;
  display: grid;
  grid-template-columns: 15rem 1fr;
  grid-template-areas:
    'aside img'
    '. title'
    '. content';

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'title'
      'aside'
      'img'
      'content';
  }

  grid-column-gap: 2rem;
  padding: 4rem 0;
  border-bottom: 1px solid #151515;
  &:last-child {
    border: none;
  }
`;

export const Aside = styled.aside`
  font-size: 1rem;
  font-stretch: normal;
  font-style: normal;
  font-variant-caps: normal;
  font-weight: 400;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.75);
  margin: 4rem 0;
  grid-area: aside;

  @media screen and (max-width: 768px) {
    margin: 0.25rem 0 2rem 0;
  }
`;

export const Thumbnail = styled.img`
  margin-bottom: 2rem;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  grid-area: img;
`;

export const Postitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  grid-area: title;
`;

export const Post = styled.div`
  font-size: 1.1rem;
  line-height: 1.6rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 0.8em;
  margin-bottom: 2rem;
  grid-area: content;

  > p a {
    text-decoration: none;
  }

  > h3,
  h4 {
    color: #fff;
    margin-top: 2rem;
  }

  > ul {
    padding: 0;
  }
`;
