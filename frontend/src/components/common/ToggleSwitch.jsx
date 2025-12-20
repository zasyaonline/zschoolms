import { useState } from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ isActive = false, onChange }) => {
  const [active, setActive] = useState(isActive);

  const handleToggle = () => {
    const newState = !active;
    setActive(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  return (
    <button
      className={`toggle-switch ${active ? 'toggle-switch--active' : 'toggle-switch--inactive'}`}
      onClick={handleToggle}
      role="switch"
      aria-checked={active}
      type="button"
    >
      <span className="toggle-switch__knob" />
    </button>
  );
};

export default ToggleSwitch;
