import React from 'react';
import { Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackspace } from '@fortawesome/free-solid-svg-icons';

export default function AppPad(props) {
  return (
    <div
      style={{
        // marginTop: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // width: '50%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}1`)}
        >
          1
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}2`)}
        >
          2
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}3`)}
        >
          3
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}4`)}
        >
          4
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}5`)}
        >
          5
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}6`)}
        >
          6
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}7`)}
        >
          7
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}8`)}
        >
          8
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}9`)}
        >
          9
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Button variant="text" size="large" className="btn-pad" />
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => props.handler(`${props.value}0`)}
        >
          0
        </Button>
        <Button
          variant="text"
          size="large"
          className="btn-pad"
          onClick={() => {
            const tmp = props.value.substring(0, props.value.length - 1);
            props.handler(`${tmp}`);
          }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesomeIcon icon={faBackspace} />
          <span style={{ fontWeight: 500, fontSize: '1.0rem' }}>Apagar</span>
        </Button>
      </div>
    </div>
  );
}
