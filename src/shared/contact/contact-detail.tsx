import Button from "antd/lib/button";
import Col from "antd/lib/col";
import Icon from "antd/lib/icon";
import Row from "antd/lib/row";
import dateFormat from "dateformat";
import gql from "graphql-tag";
// @ts-ignore
import omitDeep from "omit-deep-lodash";
import { t } from "onefx/lib/iso-i18n";
import { styled } from "onefx/lib/styletron-react";
import React, { Component } from "react";
import { Query, QueryResult } from "react-apollo";
import { connect } from "react-redux";
import { match, Route, RouteComponentProps, RouterProps } from "react-router";
import { Link, withRouter } from "react-router-dom";
// @ts-ignore
import ReactTooltip from "react-tooltip";
import { TContact2, TExperience, TInteraction } from "../../types/human";
import { BOX_SHADOW, LINE } from "../common/box-shadow";
import { CommonMargin } from "../common/common-margin";
import { Flex } from "../common/flex";
import { mdit } from "../common/markdownit";
import { NotFound } from "../common/not-found";
import { Preloader } from "../common/preloader";
import { shade } from "../common/styles/shade";
import { colors } from "../common/styles/style-color";
import { fonts } from "../common/styles/style-font";
import { ContentPadding } from "../common/styles/style-padding";
import { DeleteNotePopover } from "./delete-note-container";
import { UpsertEventContainer } from "./event/upsert-event";
import { HeatmapCalendar } from "./heatmap-calendar";
import { KeyMetrics } from "./key-metrics";
import { ProfileEditorContainer } from "./profile-editor/profile-editor";
import { ReminderCard } from "./reminder-card";
import { TagsContainer } from "./tags";

function currentTitle(human: TContact2): string {
  return (
    human.title ||
    (human.experience[0] && human.experience[0].title) ||
    (human.education[0] && human.education[0].title)
  );
}

function currentOrg(human: TContact2): string {
  return (
    human.title ||
    (human.experience[0] && human.experience[0].name) ||
    (human.education[0] && human.education[0].name)
  );
}

const Padding = styled("div", { padding: "8px" });

const SECTION = {
  backgroundColor: colors.white,
  padding: "12px",
  boxShadow: BOX_SHADOW
};

type Props = {
  isSelf?: boolean;
  ownerHumanId: string;
  match: match<{ nameDash: string }>;
} & RouterProps;

export const GET_CONTACT = gql`
  query contact($id: String, $isSelf: Boolean) {
    contact(id: $id, isSelf: $isSelf) {
      _id
      emails
      name
      phones
      avatarUrl
      address
      bornAt
      bornAddress
      knownAt
      knownSource
      extraversionIntroversion
      intuitingSensing
      thinkingFeeling
      planingPerceiving
      tdp
      inboundTrust
      outboundTrust
      blurb
      workingOn
      desire
      title
      experience {
        title
        name
      }
      education {
        title
        name
      }
      linkedin
      facebook
      github
      createAt
      createAt
    }
  }
`;

interface IProps extends RouteComponentProps<any> {
  isSelf: boolean;
}

export const ContactDetailContainer = withRouter<IProps>(
  // @ts-ignore
  connect((state: { base: { ownerHumanId: string } }) => ({
    ownerHumanId: state.base.ownerHumanId
  }))(
    // tslint:disable-next-line:max-func-body-length
    class ContactFetcher extends Component<Props> {
      public shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        return (
          this.props.match.params.nameDash !==
            nextProps.match.params.nameDash ||
          // @ts-ignore
          this.props.match.params[0].startsWith("edit") ||
          // @ts-ignore
          nextProps.match.params[0].startsWith("edit")
        );
      }

      public render(): JSX.Element | null {
        const props: Props = this.props;
        const id = props.match.params.nameDash;
        const ownerHumanId = props.ownerHumanId;
        return (
          <ContentPadding>
            <Padding />

            <Query
              ssr={false}
              query={GET_CONTACT}
              variables={{
                id: props.isSelf ? ownerHumanId : id,
                isSelf: props.isSelf
              }}
            >
              {({
                data,
                error,
                loading
              }: QueryResult<{ contact: Array<TContact2> }>) => {
                if (loading) {
                  return <Preloader />;
                }
                if (error || !data) {
                  return <NotFound />;
                }

                const human = omitDeep(data.contact, "__typename");

                if (!human) {
                  return <NotFound />;
                }

                return (
                  <Contact
                    human={human}
                    isSelf={ownerHumanId === id || props.isSelf}
                  />
                );
              }}
            </Query>
            <Padding />
          </ContentPadding>
        );
      }
    }
  )
);

// tslint:disable-next-line:max-func-body-length
function Contact({
  human,
  isSelf
}: {
  human: TContact2;
  isSelf?: boolean;
}): JSX.Element {
  return (
    <Row gutter={16}>
      <Col sm={6} xs={24}>
        <Flex {...SECTION}>
          <Flex>
            <div style={{ paddingBottom: "8px" }}>{human.address}</div>
          </Flex>
          <Flex width="100%" column={true}>
            <div style={{ position: "relative" }}>
              <img
                alt="favicon"
                style={{ width: "100%", maxWidth: "272px" }}
                src={human.avatarUrl || "/favicon-light.svg"}
              />
              <Link to="./edit/">
                <Icon1 type="edit" />
              </Link>
              <Route
                exact
                path="*/edit/"
                component={() => <ProfileEditorContainer human={human} />}
              />
            </div>
          </Flex>

          <Flex
            width="100%"
            center={true}
            column={true}
            padding="8px 0 8px 0"
            textAlign="center"
          >
            <h2 style={fonts.h2}>{human.name}</h2>
            <h3 style={fonts.h5}>{currentTitle(human)}</h3>
            <h3 style={fonts.h5}>{currentOrg(human)}</h3>
          </Flex>

          <KeyMetrics
            metrics={{
              knownAt: human.knownAt,

              inboundTrust: human.inboundTrust,
              outboundTrust: human.outboundTrust
            }}
          />

          <TitleContent title="experience" human={human} />
          <TitleContent title="education" human={human} />
          <TitleContent title="bornAt" human={human} />
          <TitleContent title="bornAddress" human={human} />
        </Flex>

        <Padding />
      </Col>
      <Col sm={12} xs={24}>
        {(human.workingOn || human.desire || human.blurb) && [
          <Flex key={0} width="100%" {...SECTION}>
            {human.blurb && <div>{human.blurb}</div>}

            <TitleContent title="workingOn" human={human} />
            <TitleContent title="desire" human={human} />
          </Flex>,
          <Padding key={1} />
        ]}

        <Flex width="100%" {...SECTION}>
          <TagsContainer contactId={human._id || ""} />
          <HeatmapCalendar
            isSelf={Boolean(isSelf)}
            contactId={String(human._id)}
          />
          <ReactTooltip />

          <Flex width="100%">
            {/*
            // @ts-ignore */}
            <UpsertEventContainer
              eventId={""}
              initialValue={""}
              humanId={human._id || ""}
              public={false}
            >
              {/*
                // @ts-ignore */}
              <Button type="primary">{t("add_event")}</Button>
            </UpsertEventContainer>
          </Flex>

          <Interactions contactId={String(human._id)} isSelf={isSelf} />
        </Flex>

        <Padding />
      </Col>
      <Col sm={6} xs={24}>
        {!isSelf && (
          <>
            <ReminderCard contactId={human._id || ""} />
            <Padding />
          </>
        )}

        <Flex column={true} {...SECTION}>
          <Flex width="100%">
            <strong>{t("personality")}</strong>

            <TitleContent title="extraversionIntroversion" human={human} />
            <TitleContent title="intuitingSensing" human={human} />
            <TitleContent title="thinkingFeeling" human={human} />
            <TitleContent title="planingPerceiving" human={human} />
          </Flex>

          <Padding />

          <Flex width="100%" borderTop={LINE}>
            <TitleContent title="tdp" human={human} />
            <TitleContent title="knownSource" human={human} />
            <TitleContent title="interests" human={human} />
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
}

function TitleContent({ title, human }: any): JSX.Element | null {
  if (!human[title]) {
    return null;
  }

  return (
    <div style={{ width: "100%", margin: "8px 0 0 0" }}>
      <div
        style={{
          color: colors.text01,
          textTransform: "uppercase",
          fontSize: "12px"
        }}
      >
        {t(title)}
      </div>
      <div>
        {Array.isArray(human[title]) ? (
          human[title].map((h: TExperience, i: number) => (
            <div
              key={i}
              style={{ marginLeft: "16px", textTransform: "capitalize" }}
            >
              {h.name}
            </div>
          ))
        ) : (
          <div style={{ marginLeft: "16px" }}>
            {(() => {
              const item = human[title];
              if (title === "bornAt") {
                return dateFormat(item, "yyyy/mm/dd");
              }
              return item;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

const Icon1 = styled(Icon, {
  ...{
    position: "absolute",
    bottom: "8px",
    right: "16px",
    fontSize: "18px"
  },

  padding: "6px",
  fontSize: "16px",
  width: "30px",
  height: "30px",
  textAlign: "center",
  textDecoration: "none",
  margin: "5px 2px",
  borderRadius: "50%",
  ":hover": {
    background: shade(colors.primary)
  },
  cursor: "pointer",
  background: colors.primary,
  color: colors.white
});

export const GET_INTERACTIONS = gql`
  query interactions(
    $contactId: String
    $offset: Float
    $limit: Float
    $isSelf: Boolean
  ) {
    interactions(
      contactId: $contactId
      offset: $offset
      limit: $limit
      isSelf: $isSelf
    ) @connection(key: "event", filter: ["contactId", "isSelf"]) {
      interactions {
        id
        content
        public
        timestamp
      }
      count
    }
  }
`;

export const PAGE_SIZE: number = 5;

class Interactions extends Component<{ contactId: string; isSelf?: boolean }> {
  // tslint:disable-next-line:max-func-body-length
  public render(): JSX.Element {
    const { contactId, isSelf } = this.props;

    const query: Record<string, any> = {
      offset: 0,
      limit: PAGE_SIZE
    };
    if (isSelf) {
      query.isSelf = true;
    } else {
      query.contactId = contactId;
    }

    return (
      <Query query={GET_INTERACTIONS} variables={query}>
        {({
          loading,
          data = { interactions: { interactions: [], count: 0 } },
          fetchMore
        }: QueryResult<{
          interactions: { interactions: Array<TInteraction>; count: Number };
        }>) => {
          if (loading) {
            return <Preloader />;
          }
          const interactions: Array<TInteraction> =
            data.interactions.interactions;
          const count: Number = data.interactions.count;
          return (
            <>
              {interactions.map((iter, i) => (
                <div
                  className="interactions-list"
                  key={i}
                  style={{
                    width: "100%",
                    borderTop: LINE,
                    margin: "12px 0 12px 0",
                    padding: "12px 0 12px 0",
                    wordBreak: "break-word"
                  }}
                >
                  <Flex>
                    <span>
                      {dateFormat(iter.timestamp, "yyyy-mm-dd HH:MM")}{" "}
                    </span>
                    <Flex>
                      {/*
            // @ts-ignore */}
                      <UpsertEventContainer
                        eventId={iter.id}
                        initialValue={iter.content}
                        humanId={contactId}
                        timestamp={iter.timestamp}
                        public={iter.public}
                      >
                        <Button type="link" size="small">
                          {t("edit")}
                        </Button>
                      </UpsertEventContainer>
                      <CommonMargin />
                      <DeleteNotePopover
                        isSelf={isSelf}
                        noteId={iter.id}
                        contactId={contactId}
                      />
                    </Flex>
                  </Flex>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: mdit.render(iter.content)
                    }}
                  />
                </div>
              ))}
              {Boolean(interactions.length) && count > interactions.length && (
                <Button
                  onClick={() => {
                    fetchMore({
                      query: GET_INTERACTIONS,
                      variables: {
                        contactId,
                        offset: interactions.length,
                        limit: PAGE_SIZE
                      },
                      updateQuery: (prev, { fetchMoreResult }) => {
                        if (!fetchMoreResult) {
                          return prev;
                        }
                        window.console.log(
                          JSON.stringify({
                            prev,
                            fetchMoreResult
                          })
                        );
                        return {
                          ...prev,
                          interactions: {
                            ...prev.interactions,
                            interactions: [
                              ...prev.interactions.interactions,
                              ...fetchMoreResult.interactions.interactions
                            ],
                            count: fetchMoreResult.interactions.count
                          }
                        };
                      }
                    }).catch(err => {
                      window.console.error(
                        `failed fetchMore for interactions: ${err}`
                      );
                    });
                  }}
                >
                  <Icon type="down" />
                  {t("fetch_more")}
                </Button>
              )}
            </>
          );
        }}
      </Query>
    );
  }
}
