import { highlight, languages } from 'prismjs';
import * as React from 'react';
import { connect } from 'react-redux';
import Editor from 'react-simple-code-editor';
import styled from 'styled-components';

import { activeServerHosting } from '../redux/hosting/selectors';
import { Hosting } from '../redux/hosting/types';
import { Dispatch, RootState } from '../redux/redux-types';
import { bg1, text } from '../styles/colors';

const EditorWrapper = styled.div`
  flex-grow: 1;
  height: 100%;
  & textarea {
    outline: none;
  }
`;

interface Props {}
interface ReduxProps {
  hosting: Hosting;
}
const HostingContainer: React.FunctionComponent<Props & ReduxProps> = ({
  hosting
}) => {
  const [state, setState] = React.useState(hosting.hostingText);
  return (
    <EditorWrapper>
      <Editor
        value={state}
        onValueChange={newCode => setState(newCode)}
        highlight={newCode => highlight(newCode, languages.js, 'js')}
        padding={10}
        style={{
          height: '100%',
          overflowY: 'scroll',
          backgroundColor: bg1,
          color: text.primary,
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12
        }}
      />
    </EditorWrapper>
  );
};

const mapStateToProps = (state: RootState, _ownProps: Props) => ({
  hosting: activeServerHosting(state)
});
const mapDispatchToProps = (_dispatch: Dispatch) => ({});
export default connect(mapStateToProps, mapDispatchToProps)(HostingContainer);