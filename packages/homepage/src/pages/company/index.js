import React from 'react';
import { Link } from 'gatsby';

import Layout from '../../components/layout';
import TitleAndMetaTags from '../../components/TitleAndMetaTags';
import { Banner, TitleWrapper, Wrapper } from '../embeds/_elements';

import KP from './images/kp.svg';
import ArchesCapital from './images/arches-capital.svg';
import Figma from './images/figma.svg';
import Framer from './images/framer.svg';
import Netlify from './images/netlify.svg';
import Vercel from './images/vercel.svg';
import eqt from './images/eqt.svg';
import picnic from './images/picnic.svg';
import Sourcegraph from './images/sourcegraph.svg';
import company from '../../assets/images/company.png';
import company2x from '../../assets/images/company@2x.png';

import AX from '../../assets/images/flags/AX.png';
import HU from '../../assets/images/flags/HU.png';
import IN from '../../assets/images/flags/IN.png';
import NL from '../../assets/images/flags/NL.png';
import NO from '../../assets/images/flags/NO.png';
import PO from '../../assets/images/flags/PO.png';
import RO from '../../assets/images/flags/RO.png';
import GM from '../../assets/images/flags/GM.png';

import { Title, Text, Investors, AngelInvestors } from './_elements';
import TeamMember from '../../components/TeamMember';

export default () => (
  <Layout>
    <TitleAndMetaTags title="Our Mission - CodeSandbox" />
    <Wrapper>
      <TitleWrapper>
        <Title>Our Mission</Title>
      </TitleWrapper>
      <Text>
        Founded in 2017 by Ives van Hoorne and Bas Buursma, our mission is to
        enable any creator to build and share their ideas. By removing
        complexity and simplifying collaboration, we want to allow everyone to
        create things with code.
      </Text>
      <Banner
        css={`
          height: auto;
          margin-bottom: 258px;
        `}
      >
        <img
          css={`
            width: 100%;
          `}
          src={company}
          srcSet={`${company} 1x, ${company2x} 2x`}
          alt="Company"
        />
      </Banner>
      <div
        css={`
          width: 862px;
          max-width: 80%;
          margin: auto;
          position: relative;

          > img {
            position: absolute;

            @media screen and (max-width: 768px) {
              display: none;
            }
          }
        `}
      >
        <img
          src={AX}
          alt=""
          css={`
            width: 54px;
            opacity: 0.2;
            transform: rotate(-7.39deg);
            top: -56px;
            left: 68px;
          `}
        />
        <img
          src={IN}
          alt=""
          css={`
            width: 44px;
            transform: rotate(-20.5deg);
            left: -84px;
          `}
        />
        <img
          src={RO}
          alt=""
          css={`
            top: 141px;
            opacity: 0.6;
            box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.24),
              0px 4px 4px rgba(0, 0, 0, 0.12);
            transform: rotate(-19.5deg);
            left: -94px;
            width: 40px;
          `}
        />

        <img
          src={GM}
          alt=""
          css={`
            top: 275px;
            width: 44.71px;
            opacity: 0.2;
            box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.24),
              0px 4px 4px rgba(0, 0, 0, 0.12);
            transform: rotate(-15deg);
            left: 31px;
          `}
        />

        <img
          src={NL}
          alt=""
          css={`
            width: 36.55px;
            opacity: 0.2;
            transform: rotate(21deg);
            top: -56px;
            right: -120px;
          `}
        />
        <img
          src={NO}
          alt=""
          css={`
            top: 20px;
            width: 66.65px;
            opacity: 0.21;
            right: -84px;
            box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.24),
              0px 4px 4px rgba(0, 0, 0, 0.12);
            transform: rotate(20.44deg);
          `}
        />
        <img
          src={PO}
          alt=""
          css={`
            top: 141px;
            border: 1px solid #343434;
            box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.24),
              0px 4px 4px rgba(0, 0, 0, 0.12);
            transform: rotate(27.03deg);
            right: -94px;
            width: 39.39px;
          `}
        />
        <img
          src={HU}
          alt=""
          css={`
            top: 275px;
            width: 36.55px;
            opacity: 0.3;
            transform: rotate(21.59deg);
            right: 31px;
          `}
        />

        <Title>Our Team</Title>
        <Text
          css={`
            height: auto;
            margin-bottom: 258px;
          `}
        >
          We’re a small but growing remote-first team of creative professionals.
          Although our headquarters are in Amsterdam, the Netherlands, most of
          our staff work from home in locations spread around the world.
          <Link
            to={`/jobs`}
            css={`
              display: block;
              margin-top: 40px;
              text-decoration: none;
              color: #0971f1;
              font-weight: 700;
            `}
          >
            View open positions
          </Link>
        </Text>
      </div>
      <div
        css={`
          margin-bottom: 371px;
          display: grid;
          grid-template-columns: repeat(4, 80px);
          grid-column-gap: 80px;
          grid-row-gap: 55px;
          justify-content: center;

          ${props => props.theme.breakpoints.md} {
            grid-template-columns: repeat(3, 80px);
          }

          ${props => props.theme.breakpoints.sm} {
            grid-template-columns: repeat(2, 80px);
          }
        `}
      >
        <TeamMember name="ives" />
        <TeamMember name="bas" />
        <TeamMember name="bogdan" />
        <TeamMember name="oskar" />
        <TeamMember name="danny" />
        <TeamMember name="christian" />
        <TeamMember name="sanne" />
        <TeamMember name="andras" />
        <TeamMember name="alex" />
        <TeamMember name="zeh" />
        <TeamMember name="danilo" />
        <TeamMember name="matan" />
        <TeamMember name="scott" />
        <TeamMember name="kate" />
        <TeamMember name="tamas" />
        <TeamMember name="jasper" />
        <TeamMember name="joana" />
        <TeamMember name="marco" />
        <Link
          to={`/jobs`}
          css={`
            display: block;
          `}
        >
          <div
            css={`
              border: 4px solid #242424;
              width: 80px;
              height: 80px;
              box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.24),
                0px 8px 4px rgba(0, 0, 0, 0.12);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 200ms ease;

              :hover {
                border: 2px solid white;

                svg {
                  transform: scale(1.1);
                }
              }
            `}
          >
            <svg width="31" height="30" viewBox="0 0 31 30" fill="none">
              <path
                d="M16.975 0.2677H14.025V13.5427H0.75V16.4927H14.025V29.7677H16.975V16.4927H30.25V13.5427H16.975V0.2677Z"
                fill="white"
              />
            </svg>
          </div>
        </Link>
      </div>

      <div
        css={`
          margin-bottom: 325px;
        `}
      >
        <Title>Our Investors </Title>
        <Text>
          Most recently we raised a Series A round, bringing our total funding
          to $15M from top-tier VCs, operators, and Angels.
        </Text>
        <Investors>
          <div>
            <img
              src={eqt}
              css={`
                width: 197px !important;
              `}
              alt="EQT"
            />
          </div>
          <div>
            <img src={KP} alt="KP" />
          </div>
          <div>
            <img src={ArchesCapital} alt="ArchesCapital" />
          </div>
        </Investors>
        <AngelInvestors>
          <div>
            <img src={Framer} alt="Framer" />
            <b>Koen Bok</b>
            Founder & CEO
          </div>
          <div>
            <img src={Figma} alt="Figma" />
            <b>Dylan Field</b>
            Founder & CEO
          </div>
          <div>
            <img
              src={Vercel}
              alt="Vercel"
              css={`
                height: 97px;
              `}
            />
            <b>Guillermo Rauch</b>
            Founder & CEO
          </div>
          <div>
            <img src={Netlify} alt="Netlify" />
            <b>Mathias Biilmann</b>
            Founder & CEO
          </div>
          <section>
            <div>
              <img src={Sourcegraph} alt="Sourcegraph" />
              <b>Quinn Slack</b>
              Founder & CEO
            </div>
            <div>
              <img src={Netlify} alt="Netlify" />
              <b>Christian Bach</b>
              Founder & President
            </div>
            <div>
              <img src={picnic} alt="Picnic" />
              <b>Daniel Gebler</b>
              Founder & CTO
            </div>
            <div>
              <div
                css={`
                  height: 97px;
                  margin-bottom: 1.625rem;
                `}
              />
              <b>Marco Jansen</b>
              Founder & CTO
            </div>
            <div>
              <div
                css={`
                  height: 97px;
                  margin-bottom: 1.625rem;
                `}
              />
              <b>Petri Parvinen</b>
              Angel Investor
            </div>
            <div>
              <div
                css={`
                  height: 97px;
                  margin-bottom: 1.625rem;
                `}
              />
              <b>Andreas Blixt</b>
              Angel Investor
            </div>
          </section>
        </AngelInvestors>
      </div>

      <section
        css={`
          padding: 4rem 0 10rem 0;
        `}
      >
        <Title>Press Kit</Title>
        <Text>
          Are you writing about us? Here are logos and product shots to download
          and use in web and print media.
          <a
            href="/CodeSandbox-Press-Kit.zip"
            download
            css={`
              display: block;
              margin: 40px;
              text-decoration: none;
              color: #0971f1;
              font-weight: 700;
            `}
          >
            Download Press Kit ↓
          </a>
        </Text>
      </section>
    </Wrapper>
  </Layout>
);
