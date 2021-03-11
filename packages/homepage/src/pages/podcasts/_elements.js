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
  font-weight: 900;
  font-size: 4.5rem;
  margin-top: 40px;
  margin-bottom: 24px;
  letter-spacing: -0.02rem;

  @media screen and (max-width: 768px) {
    font-size: 2.5rem;
    line-height: 3.5rem;
  }
`;

export const PageSubtitle = styled.h2`
  font-weight: 400;
  font-size: 19px;
  color: #999999;

  @media screen and (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const Podcasts = styled.main`
  margin-top: 80px;
  margin-bottom: 230px;
  display: flex;
  align-items: center;
  justify-content: center;

  a:not(:last-child) {
    margin-right: 36px;
  }

  img {
    filter: drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.24)),
      drop-shadow(0px 8px 4px rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    transition: transform 100ms ease;
    width: 415px;

    :hover {
      transform: scale(1.03);
    }
  }
`;

export const Episodes = styled.ul`
  margin: 0;
  list-style: none;
  margin-bottom: 200px;
`;