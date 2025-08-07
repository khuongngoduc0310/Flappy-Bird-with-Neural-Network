const ParameterForm = ({numOfBirds, onChangeBirds}) => {

    return (
        <div>
            <label>Number of birds: </label>
            <input type="text" value={numOfBirds} onChange={onChangeBirds}/>
        </div>
    )
}

export default ParameterForm;