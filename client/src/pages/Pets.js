import React, {useState} from 'react'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@apollo/react-hooks'
import PetsList from '../components/PetsList'
import NewPetModal from '../components/NewPetModal'
import Loader from '../components/Loader'

/*
@ stuff:
@skip (skip field if pet is not passed for example
)
@defer, @live
@deprecated (allows you to deprecate a field to let developers know the field is no longer used and you can put a note) (so that you don't need to version your schema)
*/

const PETS_FIELDS = gql`
  fragment PetsFields on Pet  {
    id
    name
    type
    img
    vaccinated @client
    owner {
        id
        age @client
      }
  }
`

const ALL_PETS = gql`
  query AllPets {
    pets {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`
const NEW_PET = gql`
  mutation CreateAPet($newPet:NewPetInput!) {
    addPet(input: $newPet) {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`

export default function Pets () {
  const [modal, setModal] = useState(false)
  const {data, loading, error} = useQuery(ALL_PETS)
  const [createPet, newPet] = useMutation(NEW_PET, {
    update(cache, {data: {addPet}}) {
      const data = cache.readQuery({ query: ALL_PETS})
      cache.writeQuery({
        query: ALL_PETS,
        data: {pets: [addPet, ...data.pets]} //could use concat, just dont mutate the original
      })
    }
  })

  const onSubmit = input => {
    setModal(false)
    createPet({
      variables: {newPet: input},
      optimisticResponse: {
        __typename: "Mutation",
        addPet: {
          __typename: 'Pet',
          id: Math.floor(Math.random * 1000) + Date.now(),
          name: input.name,
          img: 'https://via.placeholder.com/300',
          type: input.type
        }
      }
    })
  }

  if (loading) { // removed || newPet.loading
    return <Loader />
  }

  if (error || newPet.error) {
    return <p>error!</p>
  }

  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets}/>
      </section>
    </div>
  )
}