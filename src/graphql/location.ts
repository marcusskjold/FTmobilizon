import gql from "graphql-tag";

// This GraphQL request is never sent to the server
// @client means only in the Apollo local cache
export const CURRENT_USER_LOCATION_CLIENT = gql`
  query currentUserLocation {
    currentUserLocation @client {
      lat
      lon
      accuracy
      isIPLocation
      name
      picture
    }
  }
`;

// This GraphQL request is never sent to the server
// @client means only in the Apollo local cache
export const UPDATE_CURRENT_USER_LOCATION_CLIENT = gql`
  mutation UpdateCurrentUserLocation(
    $lat: Float
    $lon: Float
    $accuracy: Int
    $isIPLocation: Boolean
    $name: String
    $picture: pictureInfoElement
  ) {
    updateCurrentUserLocation(
      lat: $lat
      lon: $lon
      accuracy: $accuracy
      isIPLocation: $isIPLocation
      name: $name
      picture: $picture
    ) @client
  }
`;
