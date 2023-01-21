// https://www.chaijs.com/api/assert/#method_samemembers

const { assert, expect, expectRevert, withNamedArgs } = require("chai")
const { network, deployments, ethers } = require("hardhat");
const { BN } = require('@openzeppelin/test-helpers');
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Units tests of Voting smart contract", function () {
        let accounts;
        let vote;

        before(async() => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
        })

        describe("Deployment", function() {
            beforeEach(async function () {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
            it("Should deploy the smart contract", async function() {
                await deployments.fixture(["voting"])
                vote = await ethers.getContract("Voting")
            })
        })
    })